# PostgreSQL Datasource Setup for Grafana

This guide explains how to connect your Grafana instance to the PostgreSQL WRD database.

## Database Information

- **Host:** localhost:5432
- **Database:** WRD
- **User:** muhammadimran
- **PostgreSQL Version:** 14.19
- **Schema:** public

## Database Structure

The WRD database contains 6 tables:

1. **measurement_data** (17 GB) - Main measurement data with timestamps and values
2. **measurement_items** (352 kB) - Measurement item definitions and units
3. **measurements** (88 kB) - Measurement metadata and configuration
4. **rating_pairs** (888 kB) - Rating pair data for conversions
5. **ratings** (112 kB) - Rating configuration and metadata
6. **sites** (64 kB) - Site information and metadata

## Quick Setup (Automated)

### Option 1: Using the Setup Script (Recommended)

Run the automated setup script:

```bash
./setup-postgres-datasource.sh
```

This script will:
1. Prompt you for your PostgreSQL password
2. Test the connection
3. Update the datasource configuration
4. Optionally restart Grafana

### Option 2: Manual Configuration

If you prefer to configure manually:

1. **Edit the datasource configuration file:**
   ```bash
   nano grafana-dev/conf/provisioning/datasources/postgres-wrd.yaml
   ```

2. **Replace `'your_password_here'` with your actual PostgreSQL password:**
   ```yaml
   secureJsonData:
     password: 'YOUR_ACTUAL_PASSWORD'
   ```

3. **Restart Grafana:**
   ```bash
   ./dev.sh restart
   ```

## Accessing the Datasource

1. Open Grafana at: http://localhost:3000
2. Login with:
   - Username: `admin`
   - Password: `admin`
3. Go to **Configuration → Data Sources**
4. You should see **PostgreSQL-WRD** in the list
5. Click on it to test and verify the connection

## Creating Your First Query

### Example 1: List All Sites
```sql
SELECT 
  site_number,
  site_name,
  data_type,
  district
FROM sites
ORDER BY site_number;
```

### Example 2: Get Recent Measurement Data
```sql
SELECT 
  timestamp,
  item_number,
  value
FROM measurement_data
WHERE measurement_id = 1
ORDER BY timestamp DESC
LIMIT 100;
```

### Example 3: Time Series Query for Grafana
```sql
SELECT
  timestamp::timestamp AS time,
  value::numeric AS value,
  item_number::text AS metric
FROM measurement_data
WHERE 
  measurement_id = $measurement_id
  AND timestamp >= $__timeFrom()
  AND timestamp <= $__timeTo()
ORDER BY timestamp;
```

### Example 4: Join Sites with Measurements
```sql
SELECT 
  s.site_name,
  s.site_number,
  m.data_type,
  m.interpolation,
  m.num_items
FROM sites s
JOIN measurements m ON s.site_id = m.site_id
WHERE s.site_number = '$site_number';
```

## Grafana Macros for PostgreSQL

Grafana provides special macros for time-series queries:

- `$__timeFilter(column)` - Filters by dashboard time range
- `$__timeFrom()` - Start of dashboard time range
- `$__timeTo()` - End of dashboard time range
- `$__timeGroup(column, interval)` - Groups by time interval

## Performance Tips

1. **Use Time Range Filters:** Always filter by time range for the large `measurement_data` table
2. **Add Indexes:** Consider adding indexes on frequently queried columns (especially timestamp)
3. **Limit Results:** Use LIMIT clauses when testing queries
4. **Use Variables:** Create dashboard variables for site_number, measurement_id, etc.

## Creating Dashboard Variables

1. Go to Dashboard Settings → Variables
2. Click "Add variable"
3. Example variable for Site Numbers:

   - **Name:** site_number
   - **Type:** Query
   - **Data source:** PostgreSQL-WRD
   - **Query:**
     ```sql
     SELECT DISTINCT site_number FROM sites ORDER BY site_number;
     ```

## Troubleshooting

### Connection Issues

If you can't connect to the datasource:

1. **Verify PostgreSQL is running:**
   ```bash
   psql -h localhost -U muhammadimran -d WRD -c "SELECT version();"
   ```

2. **Check Grafana logs:**
   ```bash
   ./dev.sh logs
   ```

3. **Test connection manually:**
   ```bash
   psql -h localhost -U muhammadimran -d WRD -c "\conninfo"
   ```

### Common Errors

1. **"password authentication failed"**
   - Double-check your password in the datasource configuration
   - Run the setup script again

2. **"database does not exist"**
   - Verify the database name is correct (WRD)

3. **"connection refused"**
   - Ensure PostgreSQL is running on localhost:5432

## Datasource Configuration Details

The datasource is configured with:
- **Connection Type:** Proxy (server-side)
- **SSL Mode:** Disabled (suitable for localhost)
- **Max Open Connections:** 100
- **Max Idle Connections:** 2
- **Connection Max Lifetime:** 4 hours

## Next Steps

1. ✅ Set up the PostgreSQL datasource
2. Create a dashboard
3. Add panels with time-series visualizations
4. Configure dashboard variables
5. Set up alerts (optional)

## Additional Resources

- [Grafana PostgreSQL Documentation](https://grafana.com/docs/grafana/latest/datasources/postgres/)
- [PostgreSQL Query Best Practices](https://grafana.com/docs/grafana/latest/datasources/postgres/#query-editor)

---

**Note:** This is a development environment. For production deployments:
- Enable SSL/TLS connections
- Use strong passwords
- Configure proper authentication
- Set up connection pooling
- Add appropriate database indexes
