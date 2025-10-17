package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// getPresetsDir returns the directory where presets are stored
func getPresetsDir() string {
	// Store presets in Grafana data directory
	dataDir := os.Getenv("GF_PATHS_DATA")
	if dataDir == "" {
		dataDir = "data"
	}
	return filepath.Join(dataDir, "dynamodb-presets")
}

// ensurePresetsDir creates the presets directory if it doesn't exist
func ensurePresetsDir() error {
	dir := getPresetsDir()
	return os.MkdirAll(dir, 0755)
}

// getPresetFilePath returns the file path for a preset
func getPresetFilePath(presetID string) string {
	// Sanitize preset ID to prevent path traversal
	sanitized := strings.ReplaceAll(presetID, "..", "")
	sanitized = strings.ReplaceAll(sanitized, "/", "_")
	sanitized = strings.ReplaceAll(sanitized, "\\", "_")
	return filepath.Join(getPresetsDir(), sanitized+".json")
}

// handleListPresets lists all saved presets
func (d *Datasource) handleListPresets(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	backend.Logger.Info("Listing presets")

	if err := ensurePresetsDir(); err != nil {
		backend.Logger.Error("Failed to create presets directory", "error", err.Error())
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fmt.Sprintf(`{"error": "failed to create presets directory: %s"}`, err.Error())),
		})
	}

	files, err := ioutil.ReadDir(getPresetsDir())
	if err != nil {
		backend.Logger.Error("Failed to read presets directory", "error", err.Error())
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fmt.Sprintf(`{"error": "failed to read presets: %s"}`, err.Error())),
		})
	}

	var presets []uploadPresetSummary
	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(file.Name(), ".json") {
			continue
		}

		filePath := filepath.Join(getPresetsDir(), file.Name())
		data, err := ioutil.ReadFile(filePath)
		if err != nil {
			backend.Logger.Warn("Failed to read preset file", "file", file.Name(), "error", err.Error())
			continue
		}

		var preset UploadPreset
		if err := json.Unmarshal(data, &preset); err != nil {
			backend.Logger.Warn("Failed to parse preset file", "file", file.Name(), "error", err.Error())
			continue
		}

		presets = append(presets, preset.summarize())
	}

	backend.Logger.Info("Found presets", "count", len(presets))

	responseJSON, err := json.Marshal(map[string]interface{}{
		"presets": presets,
	})
	if err != nil {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fmt.Sprintf(`{"error": "failed to marshal response: %s"}`, err.Error())),
		})
	}

	return sender.Send(&backend.CallResourceResponse{
		Status: http.StatusOK,
		Body:   responseJSON,
	})
}

// handleGetPreset gets a specific preset by ID
func (d *Datasource) handleGetPreset(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender, presetID string) error {
	backend.Logger.Info("Getting preset", "id", presetID)

	filePath := getPresetFilePath(presetID)
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return sender.Send(&backend.CallResourceResponse{
				Status: http.StatusNotFound,
				Body:   []byte(fmt.Sprintf(`{"error": "preset %q not found"}`, presetID)),
			})
		}
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fmt.Sprintf(`{"error": "failed to read preset: %s"}`, err.Error())),
		})
	}

	var preset UploadPreset
	if err := json.Unmarshal(data, &preset); err != nil {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fmt.Sprintf(`{"error": "failed to parse preset: %s"}`, err.Error())),
		})
	}

	responseJSON, err := json.Marshal(preset)
	if err != nil {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fmt.Sprintf(`{"error": "failed to marshal response: %s"}`, err.Error())),
		})
	}

	return sender.Send(&backend.CallResourceResponse{
		Status: http.StatusOK,
		Body:   responseJSON,
	})
}

// handleSavePreset saves or updates a preset
func (d *Datasource) handleSavePreset(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	backend.Logger.Info("Saving preset")

	var preset UploadPreset
	if err := json.Unmarshal(req.Body, &preset); err != nil {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusBadRequest,
			Body:   []byte(fmt.Sprintf(`{"error": "invalid preset data: %s"}`, err.Error())),
		})
	}

	if preset.ID == "" {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusBadRequest,
			Body:   []byte(`{"error": "preset ID is required"}`),
		})
	}

	if preset.Name == "" {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusBadRequest,
			Body:   []byte(`{"error": "preset name is required"}`),
		})
	}

	if preset.Table == "" {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusBadRequest,
			Body:   []byte(`{"error": "table name is required"}`),
		})
	}

	if err := ensurePresetsDir(); err != nil {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fmt.Sprintf(`{"error": "failed to create presets directory: %s"}`, err.Error())),
		})
	}

	filePath := getPresetFilePath(preset.ID)
	data, err := json.MarshalIndent(preset, "", "  ")
	if err != nil {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fmt.Sprintf(`{"error": "failed to marshal preset: %s"}`, err.Error())),
		})
	}

	if err := ioutil.WriteFile(filePath, data, 0644); err != nil {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fmt.Sprintf(`{"error": "failed to write preset: %s"}`, err.Error())),
		})
	}

	backend.Logger.Info("Preset saved successfully", "id", preset.ID, "file", filePath)

	return sender.Send(&backend.CallResourceResponse{
		Status: http.StatusOK,
		Body:   []byte(fmt.Sprintf(`{"success": true, "id": %q, "message": "Preset saved successfully"}`, preset.ID)),
	})
}

// handleDeletePreset deletes a preset
func (d *Datasource) handleDeletePreset(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender, presetID string) error {
	backend.Logger.Info("Deleting preset", "id", presetID)

	filePath := getPresetFilePath(presetID)
	if err := os.Remove(filePath); err != nil {
		if os.IsNotExist(err) {
			return sender.Send(&backend.CallResourceResponse{
				Status: http.StatusNotFound,
				Body:   []byte(fmt.Sprintf(`{"error": "preset %q not found"}`, presetID)),
			})
		}
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fmt.Sprintf(`{"error": "failed to delete preset: %s"}`, err.Error())),
		})
	}

	backend.Logger.Info("Preset deleted successfully", "id", presetID)

	return sender.Send(&backend.CallResourceResponse{
		Status: http.StatusOK,
		Body:   []byte(fmt.Sprintf(`{"success": true, "message": "Preset %q deleted successfully"}`, presetID)),
	})
}

// loadPresetFromFile loads a preset from file storage by ID
func loadPresetFromFile(presetID string) (*UploadPreset, error) {
	filePath := getPresetFilePath(presetID)
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("preset %q not found", presetID)
		}
		return nil, fmt.Errorf("failed to read preset: %w", err)
	}

	var preset UploadPreset
	if err := json.Unmarshal(data, &preset); err != nil {
		return nil, fmt.Errorf("failed to parse preset: %w", err)
	}

	return &preset, nil
}
