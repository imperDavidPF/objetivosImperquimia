

export interface Objective{
    department: string;
    owner: string;
    objective: string;
    progress: number;
}

export interface OwnerStats{
    owner: string;
    department: string;
    objectives: Objective[];
    totalProgress: number;
    avgProgress: number;
    objectiveCount: number;
}

export interface DepartmentStats{
    department: string;
    objectives: Objective[];
    totalProgress: number;
    avgProgress: number;
    objectiveCount: number;
}

export interface SearchResult {
    name: string;
    department: string;
    objectiveCount: number;
}