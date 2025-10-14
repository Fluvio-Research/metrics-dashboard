package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

func (d *Datasource) handleUploadResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	switch req.Path {
	case "upload/presets":
		return d.handleUploadPresets(ctx, req, sender)
	case "upload/preview":
		return d.handleUploadPreview(ctx, req, sender)
	case "upload/execute":
		return d.handleUploadExecute(ctx, req, sender)
	case "upload/schema":
		return d.handleUploadSchema(ctx, req, sender)
	default:
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusNotFound,
			Body:   []byte(`{"error": "unknown upload endpoint"}`),
		})
	}
}

func (d *Datasource) handleUploadPresets(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	extraSettings, err := loadExtraPluginSettings(*req.PluginContext.DataSourceInstanceSettings)
	if err != nil {
		backend.Logger.Error("Failed to load upload presets", "error", err.Error())
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fmt.Sprintf(`{"error": "failed to load presets: %s"}`, err.Error())),
		})
	}

	var presetSummaries []uploadPresetSummary
	for _, preset := range extraSettings.UploadPresets {
		presetSummaries = append(presetSummaries, preset.summarize())
	}

	responseBody := struct {
		Presets []uploadPresetSummary `json:"presets"`
	}{
		Presets: presetSummaries,
	}

	body, err := json.Marshal(responseBody)
	if err != nil {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fmt.Sprintf(`{"error": "failed to marshal presets: %s"}`, err.Error())),
		})
	}

	return sender.Send(&backend.CallResourceResponse{
		Status: http.StatusOK,
		Body:   body,
	})
}

func (d *Datasource) handleUploadPreview(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	if req.Method != http.MethodPost {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusMethodNotAllowed,
			Body:   []byte(`{"error": "only POST supported for preview"}`),
		})
	}

	_, preset, plan, request, err := d.prepareUploadPlan(ctx, req)
	if err != nil {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusBadRequest,
			Body:   []byte(fmt.Sprintf(`{"error": "%s"}`, sanitizeError(err))),
		})
	}

	if !preset.AllowDryRun {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusForbidden,
			Body:   []byte(`{"error": "dry run is disabled for this preset"}`),
		})
	}

	response := uploadPreviewResponse{
		Preset:            preset.summarize(),
		ItemCount:         len(request.Items),
		Statements:        plan.statementPreviews,
		PayloadSizeBytes:  plan.payloadSizeBytes,
		EstimatedCapacity: float64(len(plan.statements)),
	}

	body, err := json.Marshal(response)
	if err != nil {
		backend.Logger.Error("Failed to marshal preview response", "error", err.Error())
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(`{"error": "failed to marshal preview response"}`),
		})
	}

	backend.Logger.Info("Upload preview generated", "preset", preset.ID, "items", len(request.Items))

	return sender.Send(&backend.CallResourceResponse{
		Status: http.StatusOK,
		Body:   body,
	})
}

func (d *Datasource) handleUploadExecute(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	if req.Method != http.MethodPost {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusMethodNotAllowed,
			Body:   []byte(`{"error": "only POST supported for execute"}`),
		})
	}

	_, preset, plan, request, err := d.prepareUploadPlan(ctx, req)
	if err != nil {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusBadRequest,
			Body:   []byte(fmt.Sprintf(`{"error": "%s"}`, sanitizeError(err))),
		})
	}

	if request.DryRun {
		if !preset.AllowDryRun {
			return sender.Send(&backend.CallResourceResponse{
				Status: http.StatusForbidden,
				Body:   []byte(`{"error": "dry run is disabled for this preset"}`),
			})
		}
		backend.Logger.Info("Upload execute called with dryRun=true", "preset", preset.ID)
		response := uploadPreviewResponse{
			Preset:            preset.summarize(),
			ItemCount:         len(request.Items),
			Statements:        plan.statementPreviews,
			PayloadSizeBytes:  plan.payloadSizeBytes,
			EstimatedCapacity: float64(len(plan.statements)),
		}
		body, err := json.Marshal(response)
		if err != nil {
			return sender.Send(&backend.CallResourceResponse{
				Status: http.StatusInternalServerError,
				Body:   []byte(fmt.Sprintf(`{"error": "failed to marshal dry run response: %s"}`, err.Error())),
			})
		}
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusOK,
			Body:   body,
		})
	}

	client, err := d.getDynamoDBClient(ctx, req.PluginContext.DataSourceInstanceSettings)
	if err != nil {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fmt.Sprintf(`{"error": "failed to get DynamoDB client: %s"}`, err.Error())),
		})
	}

	var consumed []*dynamodb.ConsumedCapacity
	var selectResults []map[string]*dynamodb.AttributeValue

	for idx, stmt := range plan.statements {
		input := &dynamodb.ExecuteStatementInput{
			Statement:              aws.String(stmt.statement),
			Parameters:             stmt.params,
			ReturnConsumedCapacity: aws.String(dynamodb.ReturnConsumedCapacityTotal),
		}

		output, execErr := client.ExecuteStatementWithContext(ctx, input)
		if execErr != nil {
			backend.Logger.Error("Upload execute failed", "preset", preset.ID, "statementIndex", idx, "error", execErr.Error())
			return sender.Send(&backend.CallResourceResponse{
				Status: http.StatusBadRequest,
				Body:   []byte(fmt.Sprintf(`{"error": "failed to execute statement %d: %s"}`, idx+1, execErr.Error())),
			})
		}

		if output.ConsumedCapacity != nil {
			consumed = append(consumed, output.ConsumedCapacity)
		}

		if preset.Operation == UploadOperationSelect && len(output.Items) > 0 {
			selectResults = append(selectResults, output.Items...)
		}
	}

	response := uploadExecuteResponse{
		Preset:           preset.summarize(),
		ItemCount:        len(plan.statements),
		Statements:       plan.statementPreviews,
		PayloadSizeBytes: plan.payloadSizeBytes,
		ConsumedCapacity: aggregateConsumedCapacity(consumed),
	}

	if preset.Operation == UploadOperationSelect {
		decoded, decodeErr := decodeResultItems(selectResults)
		if decodeErr != nil {
			backend.Logger.Error("Failed to decode select results", "error", decodeErr.Error())
			response.Warnings = append(response.Warnings, fmt.Sprintf("failed to decode select results: %s", decodeErr.Error()))
		} else {
			response.Results = decoded
		}
	}

	body, err := json.Marshal(response)
	if err != nil {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fmt.Sprintf(`{"error": "failed to marshal execute response: %s"}`, err.Error())),
		})
	}

	backend.Logger.Info("Upload execute completed", "preset", preset.ID, "statements", len(plan.statements))

	return sender.Send(&backend.CallResourceResponse{
		Status: http.StatusOK,
		Body:   body,
	})
}

func (d *Datasource) handleUploadSchema(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	extraSettings, err := loadExtraPluginSettings(*req.PluginContext.DataSourceInstanceSettings)
	if err != nil {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fmt.Sprintf(`{"error": "failed to load settings: %s"}`, err.Error())),
		})
	}

	parsed, err := url.Parse(req.URL)
	if err != nil {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusBadRequest,
			Body:   []byte(`{"error": "invalid URL"}`),
		})
	}

	presetID := parsed.Query().Get("presetId")
	if presetID == "" {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusBadRequest,
			Body:   []byte(`{"error": "presetId query parameter is required"}`),
		})
	}

	preset, err := extraSettings.findPresetByID(presetID)
	if err != nil {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusNotFound,
			Body:   []byte(fmt.Sprintf(`{"error": "%s"}`, sanitizeError(err))),
		})
	}

	response := struct {
		Preset uploadPresetSummary `json:"preset"`
	}{
		Preset: preset.summarize(),
	}

	body, err := json.Marshal(response)
	if err != nil {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(`{"error": "failed to marshal schema response"}`),
		})
	}

	return sender.Send(&backend.CallResourceResponse{
		Status: http.StatusOK,
		Body:   body,
	})
}

func (d *Datasource) prepareUploadPlan(ctx context.Context, req *backend.CallResourceRequest) (*ExtraPluginSettings, *UploadPreset, *uploadPlan, uploadExecuteRequest, error) {
	extraSettings, err := loadExtraPluginSettings(*req.PluginContext.DataSourceInstanceSettings)
	if err != nil {
		return nil, nil, nil, uploadExecuteRequest{}, fmt.Errorf("failed to load settings: %w", err)
	}

	if len(req.Body) == 0 {
		return extraSettings, nil, nil, uploadExecuteRequest{}, fmt.Errorf("request body is required")
	}

	var request uploadExecuteRequest
	if err := json.Unmarshal(req.Body, &request); err != nil {
		return extraSettings, nil, nil, uploadExecuteRequest{}, fmt.Errorf("invalid request payload: %w", err)
	}

	if request.PresetID == "" {
		return extraSettings, nil, nil, uploadExecuteRequest{}, fmt.Errorf("presetId is required")
	}

	preset, err := extraSettings.findPresetByID(request.PresetID)
	if err != nil {
		return extraSettings, nil, nil, uploadExecuteRequest{}, err
	}

	plan, err := buildUploadPlan(*preset, extraSettings.MaxUploadPayloadKB, request.Items)
	if err != nil {
		return extraSettings, preset, nil, request, err
	}

	return extraSettings, preset, plan, request, nil
}

func sanitizeError(err error) string {
	if err == nil {
		return ""
	}
	return strings.ReplaceAll(err.Error(), `"`, "'")
}
