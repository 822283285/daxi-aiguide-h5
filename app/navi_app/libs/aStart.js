let grid;
let gridData
function initializeGrid(data){
    gridData = data;
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function aStar(startGps, endGps) {
    grid = deepClone(gridData);
    const start = findClosestPoint(startGps);
    const end = findClosestPoint(endGps);

    let openList = new Set();
    let closedList = new Set();

    start.g = 0;
    start.h = heuristic(start, end);
    start.f = start.g + start.h;

    openList.add(start);

    while (openList.size > 0) {
        let current = Array.from(openList).reduce((a, b) => (a.f < b.f ? a : b));

        if (current.x === end.x && current.y === end.y) {
            let path = [];
            while (current) {
                path.push([current.x, current.y, current.lat, current.lon]);
                current = current.parent;
            }
            return simplifyPath(path.reverse());
        }

        openList.delete(current);
        closedList.add(current);

        for (let neighbor of getNeighbors(current)) {
            if (closedList.has(neighbor) || !neighbor.walkable) continue;

            let tentativeG = current.g + (isDiagonal(neighbor, current) ? 1.4 : 1);

            if (!openList.has(neighbor) || tentativeG < neighbor.g) {
                neighbor.g = tentativeG;
                neighbor.h = heuristic(neighbor, end);
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.parent = current;

                if (!openList.has(neighbor)) openList.add(neighbor);
            }
        }
    }

    return [];
}


function isDiagonal(nodeA, nodeB) {
    return Math.abs(nodeA.x - nodeB.x) === 1 && Math.abs(nodeA.y - nodeB.y) === 1;
}


function haversineDistance(coord1, coord2) {

    const deltaX = coord1.lon - coord2.lon;
    const deltaY = coord1.lat - coord2.lat;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);

}

function findClosestPoint(targetCoord) {
    let minDistance = Infinity;
    let sx, sy;
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
            const currentCoord = grid[y][x];
            if(currentCoord.walkable){
                const distance = haversineDistance(currentCoord, targetCoord);
                if (distance < minDistance) {
                    minDistance = distance;
                    sx = y;
                    sy = x;
                }
            }
        }
    }
    return grid[sx][sy];
}


// 获取邻居节点
function getNeighbors(node) {
    const directions = [
        [-1, -1], // 左上
        [-1, 1],  // 左下
        [1, -1],  // 右上
        [1, 1],   // 右下
        [0, -1], // 上
        [0, 1],  // 下
        [-1, 0], // 左
        [1, 0]   // 右
    ];
    const neighbors = [];
    for (let [dx, dy] of directions) {
        let x = node.x + dx;
        let y = node.y + dy;
        if (x >= 0 && x < grid.length && y >= 0 && y < grid[0].length) {
            neighbors.push(grid[x][y]);
        }
    }
    return neighbors;
}

// 启发函数（曼哈顿距离），可根据需要更换为其他函数
function heuristic(nodeA, nodeB) {
    const dx = Math.abs(nodeA.x - nodeB.x);
    const dy = Math.abs(nodeA.y - nodeB.y);
    return Math.max(dx, dy);
}

function calculateSlope(point1, point2) {
    if (point2[1] === point1[1]) {
        return 0;
    }
    if (point2[0] === point1[0]) {
        return 0;
    }
    return (point2[1] - point1[1]) / (point2[0] - point1[0]);
}


function areCollinear(point1, point2, point3) {
    const slope1 = calculateSlope(point1, point2);
    const slope2 = calculateSlope(point2, point3);
    return Math.abs(slope1 - slope2) < 1e-9;
}


function mergeCollinearPoints(path) {
    if (path.length < 3) {
        return path;
    }

    const mergedPath = [path[0]];

    for (let i = 1; i < path.length - 1; i++) {
        if (!areCollinear(path[i - 1], path[i], path[i + 1])) {
            mergedPath.push(path[i]);
        }
    }
    mergedPath.push(path[path.length - 1]);

    return mergedPath;
}

function simplifyPath(path) {
    let i = 1;
    for(i=2;i<path.length;i++)
    {
        const prev = path[i - 2];
        const curr = path[i-1];
        const next = path[i];

        // 检查三点是否共线
        if (isCollinear(prev, curr, next)) {
            path.splice(i-1, 1); // 移除中间点
        }
    }
    return path;
}

function isCollinear(p1, p2, p3) {
    // 使用向量叉积判断三点是否共线
    var flag =  (p2[0] - p1[0]) * (p3[1] - p2[1]) === (p2[1] - p1[1]) * (p3[0] - p2[0]);
    return !flag
}