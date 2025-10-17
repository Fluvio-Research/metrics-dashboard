# Fluvio DynamoDB Upload panel

Guided uploads for Amazon DynamoDB directly from Metrics Dashboard dashboards. This panel consumes the upload presets defined in the **Fluvio Connect DynamoDB** datasource and provides a safe UI for inserts, updates, deletes, and read-back previews.

## Highlights
- Fetch presets from the datasource and keep administrators in control of allowed operations.
- Auto-generate form fields from preset schemas or switch to raw JSON input for more complex payloads.
- Preview statements before they run (when the preset allows dry runs) and review DynamoDB consumed capacity after execution.
- Supports PartiQL templates, parameter validation, payload-size limits, and optional result rendering for `select` operations.

## Requirements
- Metrics Dashboard 10.4.0 or later.
- The **fluvio-connect-dynamodb** datasource must be installed, configured, and populated with at least one upload preset.
- Panel users need access to dashboards and the datasource (no AWS credentials are exposed in the browser).

## Using the panel
1. Add the panel to a dashboard and pick the Fluvio Connect DynamoDB datasource.
2. Choose the upload preset to expose (the list is retrieved from the datasource).
3. Enter payload data using the generated form or the raw JSON editor.
4. Click **Preview** to review the PartiQL statements that will run, or **Upload** to execute them.
5. Inspect the success banner for consumed capacity, warnings, and select results.

## Development

Install dependencies and start the plugin in watch mode:

```bash
yarn install
yarn run dev
```

Build a production bundle:

```bash
yarn run build
```

Start the local Metrics Dashboard instance provided by the scaffold (Docker required):

```bash
yarn run server
```

Lint and format:

```bash
yarn run lint
yarn run lint:fix
```

## Signing & publishing

The scaffold includes GitHub Actions and npm scripts for signing the plugin with Metrics Dashboard Cloud. See the `@metrics-dashboard/create-plugin` documentation if you plan to distribute this panel outside of development environments.
