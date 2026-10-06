from typing import List, Dict, Any

async def get_subgraph(entity_id: str, max_depth: int = 3) -> Dict[str, Any]:
    # Mock asyncpg recursive CTE query execution
    return {"nodes": [], "edges": []}

async def get_project_graph(project_id: str) -> Dict[str, Any]:
    return {"nodes": [], "edges": []}

async def find_paths(entity_a: str, entity_b: str, max_depth: int = 5) -> List[Any]:
    return []

async def get_neighbors(entity_id: str, relationship_type: str = None) -> List[Any]:
    return []
