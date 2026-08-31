# Chunks API Migration Summary

## Overview
Successfully migrated the Go `/api/v1/chunks/:knowledge_id` endpoint to Java `/knowledges/chunks` with full pagination and filtering support.

## Go Implementation Analysis

### Original Endpoint
- **Path**: `GET /api/v1/chunks/:knowledge_id`
- **Handler**: `ListKnowledgeChunks` in `internal/handler/chunk.go`
- **Service**: `ListPagedChunksByKnowledgeID` in `internal/application/service/chunk.go`
- **Repository**: `ListPagedChunksByKnowledgeID` in `internal/application/repository/chunk.go`

### Key Features
1. **Pagination**: page, page_size parameters (default: page=1, page_size=10, max=100)
2. **Chunk Type Filtering**: Default to "text", supports multiple types via query params
3. **Tag Filtering**: Filter by tag_ids
4. **Keyword Search**: 
   - Document type: search in content field
   - FAQ type: search in metadata fields (standard_question, similar_questions, answers)
5. **Sorting**:
   - Document: chunk_index ASC/DESC
   - FAQ: updated_at DESC/ASC
6. **Status Filter**: Only return chunks with status IN (0, 2) - default and indexed
7. **Enabled Filter**: Optional is_enabled boolean filter

## Java Implementation

### Files Created

1. **ChunksPageDTO.java** (`iptv-api-business/src/main/java/com/iptv/business/domain/dto/page/ChunksPageDTO.java`)
   - Query parameters DTO
   - Fields: knowledgeId, chunkType, tagIds, keyword, searchField, sortOrder, knowledgeType, isEnabled

2. **ChunksVO.java** (`iptv-api-business/src/main/java/com/iptv/business/domain/vo/ChunksVO.java`)
   - Response VO with all chunk fields
   - Uses Date type for timestamps (consistent with existing code)

### Files Modified

1. **ChunksMapper.java** (`iptv-modules/iptv-business/src/main/java/com/iptv/business/pgmapper/ChunksMapper.java`)
   - Added: `List<Chunks> queryPage(@Param("param") ChunksPageDTO param, Page page)`

2. **ChunksMapper.xml** (`iptv-modules/iptv-business/src/main/resources/pgmapper/ChunksMapper.xml`)
   - Added comprehensive `queryPage` SQL with:
     - Knowledge ID filter (required)
     - Chunk type filter (default: 'text')
     - Status filter (IN (0, 2))
     - Tag ID filter (optional)
     - Enabled filter (optional)
     - Keyword search with PostgreSQL JSON operators
     - Dynamic sorting based on knowledgeType
     - Excludes soft-deleted records (deleted_at IS NULL)

3. **ChunksService.java** (`iptv-modules/iptv-business/src/main/java/com/iptv/business/service/ChunksService.java`)
   - Added: `TableDataInfo<ChunksVO> queryPage(ChunksPageDTO dto, PageDTO pg)`

4. **ChunksServiceImpl.java** (`iptv-modules/iptv-business/src/main/java/com/iptv/business/service/impl/ChunksServiceImpl.java`)
   - Implemented queryPage method
   - Uses BeanUtil.copyToList for entity to VO conversion
   - Follows existing pagination pattern from KnowledgesServiceImpl

5. **KnowledgesController.java** (`iptv-modules/iptv-business/src/main/java/com/iptv/business/controller/KnowledgesController.java`)
   - Added: `GET /knowledges/chunks` endpoint
   - Injected ChunksService
   - Returns TableDataInfo<ChunksVO> for consistent pagination response

## API Usage

### Endpoint
```
GET /knowledges/chunks
```

### Query Parameters
- `knowledgeId` (required): Knowledge ID to query chunks for
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Page size (default: 10)
- `chunkType` (optional): Chunk type filter, default "text"
- `tagIds` (optional): Comma-separated tag IDs
- `keyword` (optional): Search keyword
- `searchField` (optional): For FAQ type - standard_question/similar_questions/answers
- `sortOrder` (optional): asc/desc
- `knowledgeType` (optional): document/faq (determines sorting field)
- `isEnabled` (optional): Boolean filter

### Response Format
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "rows": [
      {
        "id": "chunk-id",
        "knowledgeId": "knowledge-id",
        "content": "chunk content",
        "chunkIndex": 0,
        "chunkType": "text",
        "status": 2,
        "createdAt": "2026-08-31T10:00:00",
        ...
      }
    ],
    "total": 100,
    "pageNum": 1,
    "pageSize": 10
  }
}
```

## Key Differences from Go Version

1. **Path Structure**: Changed from `/chunks/:knowledge_id` to `/knowledges/chunks` with knowledgeId as query param
2. **Response Wrapper**: Uses Java's TableDataInfo instead of direct pagination response
3. **Type Safety**: Strongly typed DTOs instead of query parameter parsing
4. **Date Handling**: Uses java.util.Date instead of time.Time
5. **JSON Handling**: Jackson serialization instead of Gin's JSON response

## Testing Recommendations

1. Test pagination with various page sizes
2. Test chunk type filtering (text, image_caption, etc.)
3. Test keyword search for both document and FAQ types
4. Test tag filtering
5. Test sorting (chunk_index for docs, updated_at for FAQ)
6. Test enabled/disabled filter
7. Verify soft-deleted chunks are excluded
8. Test empty result sets

## Notes

- Follows existing Java code style and patterns
- Maintains consistency with /knowledges/list endpoint structure
- Uses MyBatis-Plus pagination plugin
- PostgreSQL-specific JSON operators for metadata search
- Soft delete pattern preserved (deleted_at IS NULL)
