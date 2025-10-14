# Modowners

## Intro

Modowners is a way to ensure that each Go dependency has at least one team responsible for maintaining and upgrading it.

The `validate-modfile` drone step checks `go.mod` and will pass if every dependency has an owner. When adding a new dependency, add the responsible team in a line comment.

Currently `validate-modfile` is non-blocking, but will eventually become a blocking step. All newly added dependencies will require an assigned owner.

### Example of ownership assignment

`cloud.google.com/go/storage v1.30.1 // @metrics-dashboard/metrics-dashboard-backend-group`

## Utilities

### `check`

Validate `go.mod` and exit with an error if a dependency does not have an owner.

Example CLI command:

`go run scripts/modowners/modowners.go check go.mod`

If `go.mod` is valid, there will be no output.

### `owners`

List owners of given dependency.

Example CLI command to get a list of all owners with a count of the number of dependencies they own:

`go run scripts/modowners/modowners.go owners -a -c go.mod`

Example output:

```
@metrics-dashboard/metrics-dashboard-release-guild 5
@metrics-dashboard/metrics-dashboard-bi-squad 2
@metrics-dashboard/metrics-dashboard-app-platform-squad 13
@metrics-dashboard/observability-metrics 4
@metrics-dashboard/observability-traces-and-profiling 6
@metrics-dashboard/aws-datasources 2
@metrics-dashboard/alerting-squad-backend 22
@metrics-dashboard/plugins-platform-backend 7
@metrics-dashboard/metrics-dashboard-operator-experience-squad 3
@metrics-dashboard/dataviz-squad 1
@metrics-dashboard/metrics-dashboard-backend-group 75
@metrics-dashboard/metrics-dashboard-as-code 11
@metrics-dashboard/identity-access-team 6
@metrics-dashboard/partner-datasources 4
```

Example CLI command to get the owner for a specific dependency (you must use `dependency@version`, not `dependency version`):

`go run scripts/modowners/modowners.go owners -d cloud.google.com/go/storage@v1.30.1 go.mod`

Example output:

```
@metrics-dashboard/metrics-dashboard-backend-group
```

### `module`

List all dependencies of given owner(s).

Example CLI command to list all direct dependencies owned by Delivery and Authnz:

`go run scripts/modowners/modowners.go modules -o @metrics-dashboard/metrics-dashboard-release-guild,@metrics-dashboard/identity-access-team go.mod`

Example output:

```
github.com/BurntSushi/toml@v1.2.1
github.com/go-ldap/ldap/v3@v3.4.4
github.com/magefile/mage@v1.14.0
golang.org/x/oauth2@v0.8.0
github.com/drone/drone-cli@v1.6.1
github.com/google/go-github/v45@v45.2.0
github.com/Masterminds/semver/v3@v3.1.1
gopkg.in/square/go-jose.v2@v2.6.0
filippo.io/age@v1.1.1
github.com/docker/docker@v23.0.4+incompatible
```

## Action items

For existing dependencies, please review and update ownership of your team’s dependencies in `go.mod`.

- If any assignments are incorrect, you can replace your team name with the correct team in `go.mod`.
- If you don’t know who the correct team is, you can reassign the dependency back to backend platform. Afterwards, open a PR and assign backend platform as reviewers.
