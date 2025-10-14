# Grafana DynamoDB data source

Query your Amazon DynamoDB using PartiQL and visualize the results in your Grafana dashboards.

#### Graph
![screenshot1](/images/screenshot1.png)
#### Table
![screenshot2](/images/screenshot2.png)

## Features
- Run any PartiQL statement with template variables and time macros (`$from`, `$to`, `$__timeFilter`, etc.) handled automatically.
- Choose a table from the UI, pull its attributes, and build queries faster with auto-filled skeletons.
- Apply DynamoDB native sort (ScanIndexForward) whenever the query pins the partition key and uses the real range key; the plugin falls back to client-side sorting if DynamoDB rejects it.
- Configure additional client-side sorting on any field, including complex timestamps, with ascending/descending options.
- Define datetime columns and transform Unix seconds, Unix milliseconds, or custom `day.js` formats into Grafana time fields.
- Page through large partitions safely: the backend follows `NextToken` pointers, trims to user `LIMIT`s, caps at 1 000 000 items, and stops long loops after ~1 minute while returning the rows collected so far.
- Discover schema details quickly: API resources expose available tables and sample attribute names for dropdowns and editors.
- Drive template variables—variable queries are executed through the same backend, returning unique values ready for dashboards.
- Built-in health check (`DescribeTable`) verifies AWS credentials and DynamoDB reachability from the datasource settings page.

## Get started
### Quick start
Run the script [quick_start.py](scripts/quick_start.py) in the root directory to start Grafana containers with the DynamoDB plugin
```
python3 scripts/quick_start.py
```
Visit your Grafana at http://localhost:3000 and configure the data source with your AWS credentials
### Full steps
1. **Download:** Obtain the latest plugin build `haohanyang-dynamodb-datasource-<version>.zip` from the [Release](https://github.com/haohanyang/dynamodb-datasource/releases).

2. **Install:** 
   - Extract the downloaded archive (`haohanyang-dynamodb-datasource-<version>.zip`) into your Grafana plugins directory (`/var/lib/grafana/plugins` or similar).
   - Ensure the plugin binaries (`dynamodb-datasource/gpx_dynamodb_datasource_*`) have execute permissions (`chmod +x`).
### Data source Configuration
The plugin uses [grafana-aws-sdk-react](https://github.com/grafana/grafana-aws-sdk-react) in the configuration page, a common package used for all AWS-related plugins(including plugins made by Grafana Lab). In addition, to test the connection, the plugin requires a "test table", to which the plugin makes a [DescribeTable](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DescribeTable.html) request.

### Query data
The plugin currently supports query via [PartiQL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ql-reference.html). The plugin performs [ExecuteStatement](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_ExecuteStatement.html) on the PartiQL statement that user enters.
*Limit the number of returned rows with the `Limit` field, flip native sort direction with the “Native Sort Order” switch, and add client-side ordering with “Sort By” + “Direction”.*

#### Datetime attribute
To parse datetime attributes in Grafana, user needs to provide attribute names and format. The format can be unix timestamp (for integers) or [day.js format](https://day.js.org/docs/en/display/format) (for strings)

| Datetime | Format |
| -------- | ------- |
| `1731017392` | Unix timestamp(s) |
| `1731017406839` | Unix timestamp(ms) |
| `2024-10-31T22:04:29+01:00` | `YYYY-MM-DDTHH:mm:ssZ` |
| `2024-10-31T21:04:29Z` | `YYYY-MM-DDTHH:mm:ss[Z]` |
| `2023-08-07T22:18:48.790770` | `YYYY-MM-DDTHH:mm:ss.SSSSSS` |
| `Thu, 31 Oct 2024 21:04:29 GMT` | `ddd, DD MMM YYYY HH:mm:ss z` |

#### Variables
* `$__from` and `$__to` (built-in): start and end in Unix timestamp(ms)
* `$from` and `$to`: start and end in Unix timestamp(s)

You can filter data within the current time range:
```sql
SELECT * FROM MyTable WHERE TimeStamp BETWEEN $from AND $to
```

#### Pagination and native sorting safeguards
- The backend keeps following DynamoDB `NextToken` pointers until it gathers all pages or the work takes roughly 1 minute (or 1000 pages), whichever happens first. Hitting a guard returns the data retrieved so far and logs a warning to help spot runaway scans.
- Results are also capped by your explicit `LIMIT` and a global safety ceiling of 1 000 000 items to prevent memory pressure.
- DynamoDB-native ordering now validates the table or index key schema before injecting an `ORDER BY`. Native sort only succeeds when the query pins the partition key with an equality check and the chosen sort key matches the table/index range key.
- When native ordering is not possible (for example, no sort key present or an incompatible WHERE clause), the plugin falls back to client-side sorting so results still appear in the requested direction.
