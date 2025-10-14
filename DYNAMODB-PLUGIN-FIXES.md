# DynamoDB Plugin Fixes - Summary

## Date: October 13, 2025

## Issues Fixed

### 1. ✅ Limit Not Working Properly with Filters
**Problem:** When using filters (time filters, etc.), the limit parameter wasn't working correctly. DynamoDB's `Limit` parameter only limits items *examined*, not items *returned* after filtering.

**Solution:** Implemented pagination for both `Scan` and `Query` operations:
- Added pagination loop that continues fetching until the desired limit is reached
- Properly enforces limit on final results after filtering
- Respects DynamoDB's pagination with `LastEvaluatedKey`
- Maximum 100 iterations to prevent infinite loops

**Files Modified:**
- `Plugins/fluvio-dynamodb-datasource/pkg/plugin/datasource.go`
  - `executeScanWithFilter()` - Lines 1411-1530
  - `executeSinglePartitionQuery()` - Lines 1279-1330

**Testing:**
```
1. Set limit to 1 in query editor
2. Add a time filter or partition key filter
3. Execute query
4. Verify exactly 1 result is returned (not more)
```

---

### 2. ✅ IN Operator for Sort Keys
**Problem:** IN operator was only available for partition keys, not for sort keys.

**Solution:** Added full IN operator support for sort keys:
- Added `sortKeyValues` array field to store multiple values
- Uses DynamoDB filter expression (since IN can't be used in key conditions for sort keys)
- Properly handles template variable substitution
- UI supports textarea for entering multiple values (one per line)

**Files Modified:**
- `Plugins/fluvio-dynamodb-datasource/pkg/plugin/datasource.go`
  - Added `SortKeyValues []string` to `DynamoQuery` struct (Line 177)
  - Added `collectSortKeyValues()` helper function (Lines 1354-1375)
  - Updated sort key handling in `executeSinglePartitionQuery()` (Lines 1106-1133)
- `Plugins/fluvio-dynamodb-datasource/src/types.ts`
  - Added `sortKeyValues?: string[]` (Line 26)
  - Updated `sortKeyOperator` to include `'in'` (Line 23)
- `Plugins/fluvio-dynamodb-datasource/src/components/QueryEditor.tsx`
  - Added IN option to sort operator dropdown (Line 886)
  - Added `onSortKeyValuesChange()` handler (Lines 569-579)
  - Added UI for sort key IN values (Lines 1256-1269)
- `Plugins/fluvio-dynamodb-datasource/src/datasource.ts`
  - Added template variable replacement for `sortKeyValues` (Lines 132-136)

**Testing:**
```
1. In Key Query mode, set a partition key
2. Add a sort key name (e.g., "timestamp")
3. Select "IN (multiple values)" operator
4. Enter multiple values in the textarea:
   value1
   value2
   value3
5. Run query
6. Verify results match any of the provided sort key values
```

---

### 3. ✅ BETWEEN Operator (Already Working)
**Status:** Already implemented and working correctly
- Available for sort keys
- Properly uses DynamoDB key condition expressions
- No changes needed

**Testing:**
```
1. Set sort key operator to "Between"
2. Enter start and end values
3. Run query
4. Verify results are within the range
```

---

### 4. ✅ Sort Functionality (Already Working)
**Status:** Already implemented and working correctly
- Sort direction (ascending/descending) available
- Uses DynamoDB's `ScanIndexForward` parameter
- Works with all query types
- No changes needed

**Testing:**
```
1. Set sort direction to "Ascending" or "Descending"
2. Run query
3. Verify results are sorted correctly by sort key
```

---

## Additional Improvements

### Filter Expression Combining
When using sort key IN operator with time filtering, both filter expressions are properly combined using AND logic.

### Template Variable Support
All new fields support Grafana template variables:
- `sortKeyValues` array items support variables
- Properly expanded before sending to DynamoDB

---

## How to Test

### Test 1: Limit with Filters
```
Query Configuration:
- Mode: Key Query
- Table: YourTable
- Partition Key: id = "test"
- Enable Time Filtering: ON
- Limit: 1

Expected: Exactly 1 result returned
```

### Test 2: Sort Key IN Operator
```
Query Configuration:
- Mode: Key Query
- Table: YourTable
- Partition Key: id = "test"
- Sort Key: status
- Operator: IN (multiple values)
- Values:
  active
  pending
  processing
- Limit: 10

Expected: Results where status is one of the provided values
```

### Test 3: Sort Key BETWEEN
```
Query Configuration:
- Mode: Key Query
- Table: YourTable
- Partition Key: datastore = "0009"
- Sort Key: timestamp
- Operator: Between
- Range Start: 1735000000
- Range End: 1738000000
- Limit: 5

Expected: 5 results with timestamps between the range
```

### Test 4: Combined Filters
```
Query Configuration:
- Mode: Key Query
- Table: YourTable
- Partition Key: id = "test"
- Sort Key: category
- Operator: IN (multiple values)
- Values:
  electronics
  books
- Enable Time Filtering: ON
- Limit: 3

Expected: 3 results matching both category IN and time filter
```

---

## Breaking Changes
None - All changes are backward compatible.

---

## Migration Notes
No migration needed. Existing queries will continue to work exactly as before.

---

## Performance Notes

1. **Limit with Filters**: May require multiple DynamoDB API calls to accumulate enough filtered results. This is expected behavior due to how DynamoDB filtering works.

2. **Sort Key IN Operator**: Uses filter expressions instead of key conditions, so may be slightly slower than direct key condition operators like `=` or `BETWEEN`.

3. **Pagination**: Implemented with a maximum of 100 iterations to prevent runaway queries. This provides good balance between functionality and safety.

---

## Code Quality
- ✅ No linter errors
- ✅ Proper error handling
- ✅ Comprehensive logging
- ✅ Type safety maintained
- ✅ Template variable support
- ✅ Backward compatible

---

## Files Changed Summary

### Backend (Go)
- `Plugins/fluvio-dynamodb-datasource/pkg/plugin/datasource.go` - Major refactoring

### Frontend (TypeScript/React)
- `Plugins/fluvio-dynamodb-datasource/src/types.ts` - Type updates
- `Plugins/fluvio-dynamodb-datasource/src/datasource.ts` - Variable handling
- `Plugins/fluvio-dynamodb-datasource/src/components/QueryEditor.tsx` - UI enhancements

---

## Next Steps (Optional Enhancements)

1. **Performance Monitoring**: Add metrics for pagination iteration counts
2. **User Feedback**: Show progress indicator when paginating through many results
3. **Query Optimization**: Suggest using key conditions over filters when possible
4. **Documentation**: Update plugin documentation with new features

---

## Support

If you encounter any issues:
1. Check browser console for error messages
2. Check Grafana server logs for backend errors
3. Verify your DynamoDB permissions include Query and Scan operations
4. Test with a simple query first (no filters) to isolate issues

