// Objectives.tsx
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Dashboard } from "./components/Dashboard";
import { DetailsObjectives } from "./components/DetailsObjectives";
import type { DepartmentStats, Objective, OwnerStats, SearchResult } from './types/types';
import { Searcher } from './components/Searcher';

export const Objectives = () => {
  // Estados
  const [objectivesData, setObjectivesData] = useState<Objective[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<{ owner: string; department: string } | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [currentDepartment, setCurrentDepartment] = useState<string>('');
  const [isDepartmentView, setIsDepartmentView] = useState<boolean>(true);
  const [departmentColors, setDepartmentColors] = useState<Record<string, string>>({});
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [uploadStatus, setUploadStatus] = useState<{ message: string; type: 'loading' | 'success' | 'error' }>({
    message: 'Cargando datos desde archivo Excel...',
    type: 'loading'
  });

  // Cargar datos al iniciar
  useEffect(() => {
    loadFromPath();
  }, []);

  // Función para procesar los datos del Excel
  const processExcelData = (data: any[]): Objective[] => {
    const processedData: Objective[] = [];
    
    data.forEach((row, index) => {
      try {
        // Normalizar nombres de columnas (buscar diferentes variaciones posibles)
        const department = row['Nombre del departamento'] || row['Departamento'] || row['nombre_departamento'] || row['DEPARTAMENTO'] || '';
        const owner = row['Propietario'] || row['Responsable'] || row['propietario'] || row['PROPIETARIO'] || '';
        const objective = row['Nombre del objetivo'] || row['Objetivo'] || row['nombre_objetivo'] || row['OBJETIVO'] || '';
        
        // Buscar diferentes nombres para la columna de progreso
        let progressValue = row['Promedio de realizacion'] || row['Avance'] || row['promedio_realizacion'] || 
                           row['AVANCE'] || row['Progreso'] || row['PROGRESO'] || 0;
        
        // Convertir a número y manejar posibles errores
        let progress = 0;
        if (typeof progressValue === 'number') {
          progress = progressValue;
        } else if (typeof progressValue === 'string') {
          // Limpiar el string y convertir a número
          const cleanValue = progressValue.toString().replace('%', '').replace(',', '.').trim();
          progress = parseFloat(cleanValue) || 0;
        }
        
        // Validar que los datos esenciales estén presentes
        if (department && owner && objective) {
          processedData.push({
            department: department.toString().trim(),
            owner: owner.toString().trim(),
            objective: objective.toString().trim(),
            progress: isNaN(progress) ? 0 : Math.min(Math.max(progress, 0), 100) // Asegurar que esté entre 0-100
          });
        } else {
          console.warn(`Fila ${index + 1} ignorada - Datos incompletos:`, { department, owner, objective });
        }
      } catch (error) {
        console.error(`Error procesando fila ${index + 1}:`, error, row);
      }
    });
    
    return processedData;
  };

  // Función para cargar desde archivo
  const loadFromPath = async () => {
    setUploadStatus({ message: 'Cargando datos desde archivo Excel...', type: 'loading' });
    
    try {
      // Ruta al archivo Excel (ajusta según tu estructura de carpetas)
      const filePath = './avanceObjetivosImperquimia.xlsx';
      
      console.log('Intentando cargar archivo desde:', filePath);
      
      const response = await fetch(filePath);
      
      if (!response.ok) {
        throw new Error(`No se pudo cargar el archivo: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Procesar el archivo Excel
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Mostrar información de las hojas disponibles
      console.log('Hojas disponibles:', workbook.SheetNames);
      
      // Usar la primera hoja por defecto
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convertir a JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log('Datos crudos del Excel:', jsonData);
      
      if (jsonData.length === 0) {
        throw new Error('El archivo Excel está vacío o no contiene datos');
      }
      
      // Procesar los datos
      const processedData = processExcelData(jsonData);
      
      if (processedData.length === 0) {
        throw new Error('No se pudieron procesar los datos del Excel. Verifica la estructura del archivo.');
      }
      
      console.log('Datos procesados:', processedData);
      
      setObjectivesData(processedData);
      setUploadStatus({ 
        message: `Datos cargados correctamente desde: ${filePath} (${processedData.length} objetivos encontrados)`, 
        type: 'success' 
      });
      
    } catch (error) {
      console.error('Error al cargar el archivo:', error);
      setUploadStatus({ 
        message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}. Cargando datos de ejemplo...`, 
        type: 'error' 
      });
      
      // Si hay error, cargar datos de ejemplo después de un breve delay
      setTimeout(() => {
        loadSampleData();
      }, 2000);
    }
  };

  // Función para cargar datos de ejemplo
  const loadSampleData = () => {
    setUploadStatus({ message: 'Cargando datos de ejemplo...', type: 'loading' });
    
    const sampleData: Objective[] = [
      { department: "AUDITORIA INTERNA", owner: "JOSE DANIEL ECHEVERRIA", objective: "Cumplir con el 100% del plan anual de capacitación que la organización asigne al área de Auditoria Interna en el ejercicio 2025", progress: 0 },
      { department: "AUDITORIA INTERNA", owner: "JOSE DANIEL ECHEVERRIA", objective: "El área de auditoria debe conocer y comprender el 80% de los procedimientos y políticas Corporativos y de Gestión de Calidad de la organización durante el ejercicio 2025", progress: 0 },
      { department: "NACIONAL DE VENTAS", owner: "HEBER ABIMAEL MATEOS", objective: "Aumentar las ventas de 2024 vs 2025, para lograr alcanzar el 100% del presupuesto anual", progress: 100 },
      { department: "NACIONAL DE VENTAS", owner: "HEBER ABIMAEL MATEOS", objective: "Cumplir al 100% con sus tareas operativas asignadas en la matriz", progress: 90 },
      { department: "TI", owner: "CESAR JARDINES", objective: "Capacitar en 2 procesos automatizados para el 31 de diciembre 2025", progress: 0 },
      { department: "TI", owner: "CESAR JARDINES", objective: "Implementar 2 mejoras tecnológicas para el 31 de diciembre de 2025", progress: 25 },
      { department: "TI", owner: "CESAR JARDINES", objective: "Implementar 2 procedimientos en relación a uso de las herramientas tecnológicas para el 31 de diciembre de 2025", progress: 50 },
    ];
    
    setObjectivesData(sampleData);
    setUploadStatus({ 
      message: `Datos de ejemplo cargados correctamente (${sampleData.length} objetivos)`, 
      type: 'success' 
    });
  };

  // Función para buscar propietarios
  const performSearch = (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    const uniqueOwners = getUniqueOwners();
    const results = uniqueOwners.filter(owner => 
      owner.name.toLowerCase().includes(query.toLowerCase()) || 
      owner.department.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(results);
  };

  // Función para obtener propietarios únicos
  const getUniqueOwners = (): SearchResult[] => {
    const ownerMap: Record<string, SearchResult> = {};
    objectivesData.forEach(item => {
      const key = `${item.owner}|${item.department}`;
      if (!ownerMap[key]) {
        ownerMap[key] = {
          name: item.owner,
          department: item.department,
          objectiveCount: 0
        };
      }
      ownerMap[key].objectiveCount++;
    });
    
    return Object.values(ownerMap);
  };

  // Función para seleccionar propietario desde búsqueda
  const selectOwnerFromSearch = (owner: string, department: string) => {
    setCurrentDepartment(department);
    setIsDepartmentView(false);
    setSelectedOwner({ owner, department });
    setSearchResults([]);
  };

  // Función para filtrar por departamento
  const filterByDepartment = (department: string) => {
    setCurrentDepartment(department);
    
    if (department === '') {
      setIsDepartmentView(true);
    } else {
      setIsDepartmentView(false);
    }
    
    setSelectedOwner(null);
    setSelectedDepartment(null);
  };

  // Función para seleccionar departamento
  const selectDepartment = (department: string) => {
    setSelectedDepartment(department);
    setSelectedOwner(null);
  };

  // Función para seleccionar propietario
  const selectOwner = (owner: string, department: string) => {
    setSelectedOwner({ owner, department });
    setSelectedDepartment(null);
  };

  // Función para limpiar selección
  const clearSelection = () => {
    setSelectedOwner(null);
    setSelectedDepartment(null);
  };

  // Calcular estadísticas por departamento
  const calculateDepartmentStats = (): DepartmentStats[] => {
    const departmentMap: Record<string, DepartmentStats> = {};
    
    objectivesData.forEach(item => {
      const dept = item.department;
      
      if (!departmentMap[dept]) {
        departmentMap[dept] = {
          department: dept,
          objectives: [],
          totalProgress: 0,
          avgProgress: 0,
          objectiveCount: 0
        };
      }
      
      departmentMap[dept].objectives.push(item);
      departmentMap[dept].totalProgress += item.progress;
    });
    
    // Calcular promedios
    const departmentStats = Object.values(departmentMap).map(deptData => {
      const avgProgress = deptData.totalProgress / deptData.objectives.length;
      return {
        ...deptData,
        avgProgress: Math.round(avgProgress * 100) / 100,
        objectiveCount: deptData.objectives.length
      };
    });
    
    return departmentStats.sort((a, b) => b.avgProgress - a.avgProgress);
  };

  // Calcular estadísticas por propietario
  const calculateOwnerStats = (): OwnerStats[] => {
    const ownerMap: Record<string, OwnerStats> = {};
    
    objectivesData.forEach(item => {
      // Filtrar por departamento si está seleccionado
      if (currentDepartment && item.department !== currentDepartment) {
        return;
      }
      
      const key = `${item.owner}|${item.department}`;
      
      if (!ownerMap[key]) {
        ownerMap[key] = {
          owner: item.owner,
          department: item.department,
          objectives: [],
          totalProgress: 0,
          avgProgress: 0,
          objectiveCount: 0
        };
      }
      
      ownerMap[key].objectives.push(item);
      ownerMap[key].totalProgress += item.progress;
    });
    
    // Calcular promedios
    const ownerStats = Object.values(ownerMap).map(ownerData => {
      const avgProgress = ownerData.totalProgress / ownerData.objectives.length;
      return {
        ...ownerData,
        avgProgress: Math.round(avgProgress * 100) / 100,
        objectiveCount: ownerData.objectives.length
      };
    });
    
    return ownerStats.sort((a, b) => b.avgProgress - a.avgProgress);
  };

  // Calcular cumplimiento promedio
  const calculateCompliance = (): number => {
    let filteredObjectives = objectivesData;
    if (currentDepartment) {
      filteredObjectives = objectivesData.filter(item => item.department === currentDepartment);
    }
    
    const total = filteredObjectives.length;
    const totalProgress = filteredObjectives.reduce((sum, obj) => sum + obj.progress, 0);
    return total > 0 ? Math.round((totalProgress / total) * 100) / 100 : 0;
  };

  return (
    <div className="container">
      <Searcher
        uploadStatus={uploadStatus}
        searchResults={searchResults}
        onSearch={performSearch}
        onSelectOwner={selectOwnerFromSearch}
        onClearSearch={() => setSearchResults([])}
      />
      <Dashboard 
        objectivesData={objectivesData}
        currentDepartment={currentDepartment}
        isDepartmentView={isDepartmentView}
        departmentColors={departmentColors}
        onFilterDepartment={filterByDepartment}
        onSelectDepartment={selectDepartment}
        onSelectOwner={selectOwner}
        complianceValue={calculateCompliance()}
      />
      <DetailsObjectives 
        selectedOwner={selectedOwner}
        selectedDepartment={selectedDepartment}
        objectivesData={objectivesData}
        currentDepartment={currentDepartment}
      />
    </div>
  );
};