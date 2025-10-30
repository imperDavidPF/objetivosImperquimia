// DetailsObjectives.tsx
import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import type { Objective } from '../types/types';

interface DetailsObjectivesProps {
  selectedOwner: { owner: string; department: string } | null;
  selectedDepartment: string | null;
  objectivesData: Objective[];
  currentDepartment: string;
}

export const DetailsObjectives = ({
  selectedOwner,
  selectedDepartment,
  objectivesData,
  currentDepartment: _currentDepartment // Prefijado con _ para indicar que no se usa
}: DetailsObjectivesProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Obtener objetivos basados en la selección
  const getFilteredObjectives = (): Objective[] => {
    if (selectedOwner) {
      return objectivesData.filter(
        item => item.owner === selectedOwner.owner && item.department === selectedOwner.department
      );
    } else if (selectedDepartment) {
      return objectivesData.filter(item => item.department === selectedDepartment);
    }
    return [];
  };

  // Calcular estadísticas por propietario para un departamento
  const calculateOwnerStatsForDepartment = (department: string) => {
    const ownerMap: Record<string, { owner: string; objectives: Objective[]; totalProgress: number }> = {};
    
    objectivesData.forEach(item => {
      if (item.department !== department) return;
      
      if (!ownerMap[item.owner]) {
        ownerMap[item.owner] = {
          owner: item.owner,
          objectives: [],
          totalProgress: 0
        };
      }
      
      ownerMap[item.owner].objectives.push(item);
      ownerMap[item.owner].totalProgress += item.progress;
    });
    
    return Object.values(ownerMap).map(ownerData => ({
      ...ownerData,
      avgProgress: Math.round((ownerData.totalProgress / ownerData.objectives.length) * 100) / 100
    }));
  };

  // Actualizar gráfico de detalles
  const updateDetailsChart = () => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destruir gráfico anterior
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const filteredObjectives = getFilteredObjectives();

    if (filteredObjectives.length === 0) {
      return;
    }

    if (selectedDepartment) {
      // Gráfico de propietarios en el departamento
      const ownerStats = calculateOwnerStatsForDepartment(selectedDepartment);
      
      const labels = ownerStats.map(owner => owner.owner);
      const data = ownerStats.map(owner => owner.avgProgress);
      
      const backgroundColors = data.map(progress => {
        if (progress >= 80) return 'rgba(75, 192, 192, 0.7)';
        if (progress >= 50) return 'rgba(255, 205, 86, 0.7)';
        return 'rgba(255, 99, 132, 0.7)';
      });

      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Avance Promedio (%)',
            data: data,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Porcentaje de Avance'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Propietarios'
              }
            }
          }
        }
      });
    } else if (selectedOwner) {
      // Gráfico de objetivos del propietario
      const labels = filteredObjectives.map(obj => 
        obj.objective.length > 50 ? 
        obj.objective.substring(0, 50) + '...' : obj.objective
      );
      
      const data = filteredObjectives.map(obj => obj.progress);
      
      const backgroundColors = data.map(progress => {
        if (progress >= 80) return 'rgba(75, 192, 192, 0.7)';
        if (progress >= 50) return 'rgba(255, 205, 86, 0.7)';
        return 'rgba(255, 99, 132, 0.7)';
      });

      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Avance (%)',
            data: data,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
            borderWidth: 1
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Porcentaje de Avance'
              }
            }
          }
        }
      });
    }
  };

  useEffect(() => {
    updateDetailsChart();

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [selectedOwner, selectedDepartment, objectivesData]);

  const filteredObjectives = getFilteredObjectives();
  const hasSelection = selectedOwner || selectedDepartment;
  const hasObjectives = filteredObjectives.length > 0;

  const getDetailsTitle = () => {
    if (selectedOwner) {
      return `Objetivos de ${selectedOwner.owner} (${selectedOwner.department})`;
    } else if (selectedDepartment) {
      return `Objetivos del Departamento ${selectedDepartment}`;
    }
    return 'Detalle de Objetivos';
  };

  const getTableTitle = () => {
    if (selectedOwner) {
      return `Lista de Objetivos - ${selectedOwner.owner}`;
    } else if (selectedDepartment) {
      return `Lista de Objetivos - ${selectedDepartment}`;
    }
    return 'Lista de Objetivos';
  };

  return (
    <div className="details-section">
      <div className="card">
        <h2>{getDetailsTitle()}</h2>
        {!hasSelection ? (
          <div className="no-selection">
            <p>Selecciona un departamento o propietario del gráfico para ver el detalle de sus objetivos</p>
          </div>
        ) : (
          <div className="chart-container">
            <canvas ref={chartRef} id="detailsChart"></canvas>
          </div>
        )}
      </div>

      <div className="card">
        <h2>{getTableTitle()}</h2>
        {!hasSelection ? (
          <div className="no-selection">
            <p>Selecciona un departamento o propietario para ver la lista de sus objetivos</p>
          </div>
        ) : !hasObjectives ? (
          <div className="no-selection">
            <p>No se encontraron objetivos para la selección actual</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Objetivo</th>
                  <th>Avance</th>
                  <th>Progreso</th>
                </tr>
              </thead>
              <tbody>
                {filteredObjectives.map((obj, index) => {
                  const progressColor = obj.progress < 60 ? '#e74c3c' : '#4caf50';
                  return (
                    <tr key={index}>
                      <td>{obj.objective}</td>
                      <td>{obj.progress}%</td>
                      <td>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${obj.progress}%`, 
                              backgroundColor: progressColor 
                            }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>    
    </div>
  );
};