// Componente principal para mostrar el pronóstico del clima
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Clima.css';

// Configuración del ícono del marcador
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Componente para actualizar el mapa cuando cambia la ubicación
function ActualizarMapa({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Componente funcional principal
const Clima = () => {
  console.log('Renderizando componente Clima');
  
  // Estados principales del componente
  const [busqueda, setBusqueda] = useState('');      // Texto del input de búsqueda
  const [ciudad, setCiudad] = useState('');          // Nombre de la ciudad actual
  const [datos, setDatos] = useState(null);          // Respuesta completa de One Call 3.0
  const [cargando, setCargando] = useState(false);   // Estado de carga
  const [error, setError] = useState('');            // Mensaje de error
  
  console.log('Estado actual:', { cargando, error, datos: datos ? 'Datos cargados' : 'Sin datos', ciudad });

  // API KEY de OpenWeatherMap (One Call 3.0)
  // NOTA: Reemplaza esto con tu clave API de pago
  const API_KEY = 'TU_CLAVE_DE_API_DE_PAGO_AQUI';
  
  // Referencia para el input de búsqueda
  const inputBusquedaRef = useRef(null);
  
  // Estado para las sugerencias de búsqueda
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  
  // Estado para la ubicación del mapa
  const [mapCenter, setMapCenter] = useState([-34.6037, -58.3816]); // Buenos Aires por defecto

  // Función para buscar sugerencias de ciudades
  const buscarSugerencias = async (texto) => {
    if (texto.length < 2) {
      setSugerencias([]);
      return;
    }
    
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(texto)}&limit=5&appid=${API_KEY}`
      );
      
      if (!response.ok) throw new Error('Error al buscar sugerencias');
      
      const data = await response.json();
      setSugerencias(data);
      setMostrarSugerencias(true);
    } catch (error) {
      console.error('Error al buscar sugerencias:', error);
      setSugerencias([]);
    }
  };
  
  // Función para manejar la selección de una sugerencia
  const seleccionarSugerencia = (sugerencia) => {
    setBusqueda(`${sugerencia.name}, ${sugerencia.country}`);
    setSugerencias([]);
    setMostrarSugerencias(false);
    buscarClima(sugerencia);
  };

  // Función para buscar clima usando Geocoding API y One Call 3.0
  const buscarClima = async (ubicacion) => {
    setCargando(true);
    setError('');
    setDatos(null);
    setCiudad('');
    
    try {
      let lat, lon, name, country, state;
      
      // Si es un objeto de sugerencia
      if (typeof ubicacion === 'object') {
        ({ lat, lon, name, country, state } = ubicacion);
      } else {
        // Si es un texto de búsqueda
        const respGeo = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(ubicacion)}&limit=1&appid=${API_KEY}`
        );
        
        if (!respGeo.ok) throw new Error('No se pudo obtener la ubicación');
        
        const geoData = await respGeo.json();
        if (!geoData[0]) throw new Error('Ciudad no encontrada');
        
        ({ lat, lon, name, country, state } = geoData[0]);
      }
      
      // Actualizar la ubicación del mapa
      setMapCenter([lat, lon]);
      
      // Formatear el nombre de la ciudad
      const nombreCiudad = `${name}${state ? `, ${state}` : ''}, ${country}`;
      setCiudad(nombreCiudad);

      // Llamar a la One Call 3.0 API con las coordenadas obtenidas
      // Documentación: https://openweathermap.org/api/one-call-3
      const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}&exclude=minutely`;
      console.log('URL de la API:', url);
      
      const respClima = await fetch(url);
      
      if (!respClima.ok) {
        let errorMessage = 'No se pudo obtener el clima';
        try {
          const errorData = await respClima.text();
          console.error('Error de la API (texto):', errorData);
          // Intentar parsear como JSON si es posible
          try {
            const jsonError = JSON.parse(errorData);
            console.error('Error de la API (JSON):', jsonError);
            errorMessage = jsonError.message || errorMessage;
          } catch (e) {
            errorMessage = errorData || errorMessage;
          }
        } catch (e) {
          console.error('Error al procesar el error:', e);
        }
        throw new Error(errorMessage);
      }
      
      const datosClima = await respClima.json();
      console.log('Datos del clima recibidos:', datosClima);
      
      // Verificar que la respuesta tenga la estructura esperada
      if (!datosClima.current || !datosClima.hourly || !datosClima.daily) {
        console.error('Estructura de datos inesperada:', datosClima);
        throw new Error('Formato de respuesta inesperado de la API');
      }
      
      setDatos(datosClima);
    } catch (e) {
      setError(e.message || 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  // Al montar, intentar obtener la ubicación del usuario
  useEffect(() => {
    console.log('useEffect de montaje ejecutándose');
    const obtenerUbicacionUsuario = () => {
      if (navigator.geolocation) {
        console.log('Solicitando ubicación al navegador...');
        navigator.geolocation.getCurrentPosition(
          (posicion) => {
            console.log('Ubicación obtenida:', posicion.coords);
            const { latitude, longitude } = posicion.coords;
            // Usar la API de geocodificación inversa para obtener el nombre de la ciudad
            fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`)
              .then(res => res.json())
              .then(data => {
                if (data && data[0]) {
                  buscarClima(data[0].name);
                } else {
                  console.log('No se pudo obtener el nombre de la ciudad, usando coordenadas');
                  buscarClima({ lat: latitude, lon: longitude, name: 'Tu Ubicación' });
                }
              })
              .catch(error => {
                console.error('Error al obtener el nombre de la ciudad:', error);
                buscarClima({ lat: latitude, lon: longitude, name: 'Tu Ubicación' });
              });
          },
          (error) => {
            console.error('Error al obtener la ubicación:', error);
            // Si hay un error o el usuario deniega la ubicación, usar Buenos Aires por defecto
            console.log('Usando ubicación por defecto: Buenos Aires');
            buscarClima('Buenos Aires');
          }
        );
      } else {
        console.log('Geolocalización no soportada, usando Buenos Aires por defecto');
        // Si el navegador no soporta geolocalización, usar Buenos Aires por defecto
        buscarClima('Buenos Aires');
      }
    };

    obtenerUbicacionUsuario();
  }, []);

  // Estilos reutilizables
  // Todos los estilos se manejan ahora por clases CSS en Clima.css
  // Elimina estilos inline y usa solo clases para mantener el orden y la mantenibilidad.

  // Animación para el spinner de carga
  const estilosGlobales = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
    }
    .clima-cargando {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 40px;
      text-align: center;
      color: #1976d2;
    }
    .clima-cargando .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(25, 118, 210, 0.2);
      border-top-color: #1976d2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .clima-error {
      background-color: #ffebee;
      color: #c62828;
      padding: 16px;
      border-radius: 8px;
      margin: 16px 0;
      text-align: center;
      border-left: 4px solid #f44336;
    }
  `;

  // Agregar estilos globales
  const estiloGlobal = document.createElement('style');
  estiloGlobal.textContent = estilosGlobales;
  document.head.appendChild(estiloGlobal);

  // Función auxiliar para formatear fechas
  const formatearFecha = (timestamp, opciones = {}) => {
    const fecha = new Date(timestamp * 1000);
    const opcionesPorDefecto = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    };
    
    // Fusionar opciones personalizadas con las predeterminadas
    const opcionesFinales = { ...opcionesPorDefecto, ...opciones };
    
    // Si no se especifican opciones de hora, eliminarlas
    if (!opciones.hour && !opciones.minute) {
      delete opcionesFinales.hour;
      delete opcionesFinales.minute;
      delete opcionesFinales.hour12;
    }
    
    return fecha.toLocaleDateString('es-AR', opcionesFinales);
  };

  // Función auxiliar para formatear solo fecha
  const formatearSoloFecha = (dt) => {
    return new Date(dt * 1000).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' });
  };

  // Renderizado principal
  return (
  <div className="clima-principal">
    <h1 className="clima-titulo-principal">Pronóstico del Clima Avanzado</h1>
    <div className="clima-info-api">
      <div className="clima-info-api-row">
        <span>🌍 <b>API Premium:</b> OpenWeatherMap One Call 3.0</span>
        <span>•</span>
        <span>⏱️ Actualización en tiempo real</span>
        <span>•</span>
        <span>📍 Precisión mejorada</span>
      </div>
      <div className="clima-info-api-link">
        <a
          href="https://openweathermap.org/api/one-call-3"
          target="_blank"
          rel="noopener noreferrer"
        >
          Documentación de la API
        </a>
      </div>
    </div>

    {/* Fallback de error */}
    {error && (
      <div className="clima-error">
        <b>Error:</b> {error}
      </div>
    )}

    {/* Fallback de carga */}
    {cargando && (
      <div className="clima-cargando">
        <div className="spinner"></div>
        <div>Cargando datos del clima...</div>
      </div>
    )}

    {/* Fallback de bienvenida si no hay datos y no está cargando ni error */}
    {!cargando && !error && !datos && (
      <div className="clima-bienvenida">
        <p>Busca una ciudad para ver el pronóstico detallado, o permite la geolocalización para usar tu ubicación actual.</p>
      </div>
    )}


      {/* Formulario de búsqueda de ciudad */}
      <div className="clima-busqueda-contenedor">
        <form
          onSubmit={e => {
            e.preventDefault();
            if (busqueda.trim()) buscarClima(busqueda.trim());
          }}
          className="clima-formulario"
        >
          <div className="clima-busqueda-input-contenedor">
            <input
              ref={inputBusquedaRef}
              type="text"
              value={busqueda}
              onChange={e => {
                setBusqueda(e.target.value);
                buscarSugerencias(e.target.value);
              }}
              onFocus={(e) => {
                setMostrarSugerencias(true);
                e.target.classList.add('clima-input-focus');
              }}
              onBlur={(e) => {
                setTimeout(() => setMostrarSugerencias(false), 200);
                e.target.classList.remove('clima-input-focus');
              }}
              placeholder="Buscar ciudad, país (ej: Cordoba, AR)"
              className="clima-busqueda-input"
            />
            
            {mostrarSugerencias && sugerencias.length > 0 && (
              <div className="clima-sugerencias-lista">
                {sugerencias.map((sugerencia, index) => (
                  <div
                    key={`${sugerencia.lat}-${sugerencia.lon}-${index}`}
                    onClick={() => seleccionarSugerencia(sugerencia)}
                    className="clima-sugerencia-item"
                  >
                    <span className="clima-sugerencia-icono">📍</span>
                    <div className="clima-sugerencia-texto">
                      <div className="clima-sugerencia-nombre">{sugerencia.name}</div>
                      <div className="clima-sugerencia-desc">
                        {sugerencia.state ? `${sugerencia.state}, ` : ''}{sugerencia.country}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button type="submit" className="clima-busqueda-boton">
            <span className="clima-busqueda-icono">🔍</span> Buscar
          </button>
        </form>
      </div>
      {/* Mensaje de error si la ciudad no existe */}
      {error && (
        <div className="clima-error">No se pudo encontrar la ciudad. Intenta con otro nombre.</div>
      )}
      
      {/* Mensaje de carga */}
      {cargando && (
        <div className="clima-cargando">
          <div className="spinner"></div>
          <p>Cargando datos del clima...</p>
        </div>
      )}
      
      {/* Mapa de localización */}
      {!cargando && !error && datos && datos.current && (
        <div className="clima-mapa-contenedor">
          <div className="clima-mapa-header">
            <span className="clima-mapa-icono">📍</span>
            <h3 className="clima-mapa-titulo">Ubicación Actual: {ciudad}</h3>
          </div>
          <div className="clima-mapa-contenido">
            <MapContainer 
              center={mapCenter} 
              zoom={11} 
              zoomControl={false}
              className="clima-mapa"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={mapCenter}>
                <Popup>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{ciudad}</div>
                    {datos.current.weather && datos.current.weather[0] && (
                      <div>
                        <img 
                          src={`https://openweathermap.org/img/wn/${datos.current.weather[0].icon}@2x.png`} 
                          alt={datos.current.weather[0].description}
                          style={{ width: '50px', height: '50px', margin: '0 auto' }}
                        />
                        <div>{Math.round(datos.current.temp)}°C</div>
                        <div style={{ textTransform: 'capitalize' }}>
                          {datos.current.weather[0].description}
                        </div>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
              <ActualizarMapa center={mapCenter} />
            </MapContainer>
          </div>
        </div>
      )}
      
      {/* Renderizado de datos actuales del clima */}
      {!cargando && !error && datos && datos.current && (
        <div className="clima-bloque-principal">
          {/* Efecto de gradiente en la esquina superior derecha */}
          <div className="clima-bloque-gradiente"></div>
          
          {/* Indicador de actualización */}
          <div className="clima-actualizado-indicador">
            <span className="clima-actualizado-punto"></span>
            Actualizado ahora
          </div>
          
          {/* Icono y datos principales del clima actual */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            zIndex: 1,
            position: 'relative'
          }}>
            <img
              src={`https://openweathermap.org/img/wn/${datos.current.weather[0]?.icon}@4x.png`}
              alt={datos.current.weather[0]?.description || ''}
              style={{ 
                width: '140px', 
                height: '140px', 
                marginBottom: '10px',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))'
              }}
            />
            <div style={{
              background: 'rgba(25, 118, 210, 0.1)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              color: '#1976d2',
              fontWeight: 600,
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>☀️</span>
              <span>Índice UV: {datos.current.uvi}</span>
            </div>
          </div>
          
          <div style={{ 
            minWidth: 260,
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '8px'
            }}>
              <h2 style={{ 
                fontSize: '32px', 
                margin: 0, 
                color: '#0d47a1', 
                textShadow: 'none',
                fontWeight: '800',
                letterSpacing: '-0.5px'
              }}>
                {ciudad}
              </h2>
              <div style={{
                background: '#e3f2fd',
                color: '#1565c0',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>🕒</span>
                <span>{formatearFecha(datos.current.dt, { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            
            <div style={{ 
              fontSize: '16px', 
              color: '#546e7a', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{formatearFecha(datos.current.dt, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              <span>•</span>
              <span>{datos.current.weather[0]?.description ? 
                datos.current.weather[0].description.charAt(0).toUpperCase() + datos.current.weather[0].description.slice(1) : ''}
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '64px', fontWeight: '900', color: '#1976d2' }}>
                {Math.round(datos.current.temp)}°C
              </div>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '4px',
                fontSize: '15px',
                color: '#546e7a'
              }}>
                <div>🌡️ Sensación: <b>{Math.round(datos.current.feels_like)}°C</b></div>
                <div>💧 Humedad: <b>{datos.current.humidity}%</b></div>
                <div>💨 Viento: <b>{datos.current.wind_speed} m/s</b></div>
                <div>🌫️ Visibilidad: <b>{(datos.current.visibility / 1000).toFixed(1)} km</b></div>
              </div>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '12px',
              marginTop: '16px'
            }}>
              <div style={estiloIndicador}>
                <span>💧</span>
                <div>
                  <div>Punto de rocío</div>
                  <div style={{ fontWeight: '600', color: '#1565c0' }}>{Math.round(datos.current.dew_point)}°C</div>
                </div>
              </div>
              
              <div style={estiloIndicador}>
                <span>📊</span>
                <div>
                  <div>Presión</div>
                  <div style={{ fontWeight: '600', color: '#1565c0' }}>{datos.current.pressure} hPa</div>
                </div>
              </div>
              
              <div style={estiloIndicador}>
                <span>🌅</span>
                <div>
                  <div>Amanecer</div>
                  <div style={{ fontWeight: '600', color: '#1565c0' }}>
                    {new Date(datos.current.sunrise * 1000).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              
              <div style={estiloIndicador}>
                <span>🌇</span>
                <div>
                  <div>Atardecer</div>
                  <div style={{ fontWeight: '600', color: '#1565c0' }}>
                    {new Date(datos.current.sunset * 1000).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Renderizado del pronóstico horario */}
      {!cargando && !error && datos && datos.hourly && (
        <div style={{ 
          width: '100%', 
          maxWidth: 1000, 
          marginBottom: 36,
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          border: '1px solid rgba(25, 118, 210, 0.1)'
        }}>
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '18px',
              fontWeight: '600',
              color: '#0d47a1',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>📅</span>
              <span>Pronóstico por horas</span>
            </h3>
            <div style={{
              fontSize: '14px',
              color: '#5c6bc0',
              background: '#e8eaf6',
              padding: '4px 10px',
              borderRadius: '12px',
              fontWeight: '500'
            }}>
              Próximas 24 horas
            </div>
          </div>
          
          <div style={{ 
            padding: '16px',
            position: 'relative',
            overflowX: 'auto'
          }}>
            <div style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '40px',
              background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,1) 100%)',
              pointerEvents: 'none',
              zIndex: 2
            }} />
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              paddingBottom: '16px',
              width: 'max-content',
              minWidth: '100%'
            }}>
              {datos.hourly.slice(0, 24).map((hora, index) => {
                const fechaHora = new Date(hora.dt * 1000);
                const esAhora = index === 0;
                const esNoche = fechaHora.getHours() >= 18 || fechaHora.getHours() < 6;
                
                return (
                  <div 
                    key={index}
                    style={{ 
                      minWidth: '80px',
                      padding: '16px 12px',
                      background: esAhora ? '#e3f2fd' : 'white',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      textAlign: 'center',
                      border: `1px solid ${esAhora ? '#64b5f6' : '#e0e0e0'}`,
                      position: 'relative',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                    }}
                  >
                    {esAhora && (
                      <div style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#1976d2',
                        color: 'white',
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        zIndex: 3
                      }}>
                        Ahora
                      </div>
                    )}
                    
                    <div style={{ 
                      fontSize: '14px', 
                      color: esAhora ? '#0d47a1' : '#555',
                      fontWeight: esAhora ? '600' : '400',
                      marginBottom: '8px',
                      whiteSpace: 'nowrap'
                    }}>
                      {index === 0 ? 'Ahora' : fechaHora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    
                    <div style={{
                      width: '40px',
                      height: '40px',
                      margin: '0 auto 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img 
                        src={`https://openweathermap.org/img/wn/${hora.weather[0]?.icon}@2x.png`} 
                        alt={hora.weather[0]?.description || ''}
                        style={{ 
                          width: '100%', 
                          height: '100%',
                          objectFit: 'contain',
                          filter: esNoche ? 'grayscale(30%) brightness(0.9)' : 'none'
                        }}
                      />
                    </div>
                    
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '700', 
                      color: esAhora ? '#1565c0' : '#1976d2',
                      marginBottom: '4px'
                    }}>
                      {Math.round(hora.temp)}°C
                    </div>
                    
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#546e7a', 
                      marginBottom: '4px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}>
                      💧 {hora.pop ? Math.round(hora.pop * 100) : 0}%
                    </div>
                    
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#78909c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      marginTop: '4px'
                    }}>
                      <span>💨</span>
                      <span>{Math.round(hora.wind_speed)} m/s</span>
                    </div>
                    
                    {hora.rain && hora.rain['1h'] && (
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: '#bbdefb',
                        color: '#0d47a1',
                        borderRadius: '8px',
                        fontSize: '9px',
                        padding: '1px 4px',
                        fontWeight: '600'
                      }}>
                        🌧️ {hora.rain['1h']}mm
                      </div>
                    )}
                    
                    {hora.snow && hora.snow['1h'] && (
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: '#e3f2fd',
                        color: '#0d47a1',
                        borderRadius: '8px',
                        fontSize: '9px',
                        padding: '1px 4px',
                        fontWeight: '600'
                      }}>
                        ❄️ {hora.snow['1h']}mm
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Pronóstico diario (próximos 7 días) */}
      {!cargando && !error && datos && datos.daily && (
        <div className="clima-diario-container">
          <div className="clima-diario-header">
  <h3 className="clima-diario-titulo">
    <span>📆</span>
    <span>Pronóstico semanal</span>
  </h3>
  <div className="clima-diario-chip">Próximos 7 días</div>
</div>
          
          <div className="clima-diario-lista">
            {datos.daily.slice(0, 7).map((dia, i) => {
              const fecha = new Date(dia.dt * 1000);
              const diaSemana = fecha.toLocaleDateString('es-AR', { weekday: 'long' });
              const fechaFormateada = fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
              const esHoy = i === 0;
              const tempMax = Math.round(dia.temp.max);
              const tempMin = Math.round(dia.temp.min);
              
              // Calcular el ancho de las barras de temperatura
              const todasTemps = datos.daily.slice(0, 7).flatMap(d => [d.temp.max, d.temp.min]);
              const tempMasAlta = Math.max(...todasTemps);
              const tempMasBaja = Math.min(...todasTemps);
              const rangoTemperatura = tempMasAlta - tempMasBaja || 1; // Evitar división por cero
              
              const anchoMax = Math.max(10, Math.min(100, ((tempMax - tempMasBaja) / rangoTemperatura) * 100));
              const anchoMin = Math.max(10, Math.min(100, ((tempMin - tempMasBaja) / rangoTemperatura) * 100));
              
              return (
                <div 
                  key={dia.dt} 
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 20px',
                    background: esHoy ? '#e3f2fd' : 'white',
                    borderRadius: '8px',
                    margin: '4px 0',
                    transition: 'all 0.2s ease',
                    border: `1px solid ${esHoy ? '#64b5f6' : '#e0e0e0'}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  {/* Día y fecha */}
                  <div style={{ 
                    minWidth: '140px',
                    fontWeight: esHoy ? '600' : '500',
                    color: esHoy ? '#0d47a1' : '#333',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <span>{esHoy ? 'Hoy' : diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)}</span>
                    <span style={{ 
                      fontSize: '12px', 
                      color: esHoy ? '#1976d2' : '#666',
                      marginTop: '2px'
                    }}>
                      {fechaFormateada}
                    </span>
                  </div>
                  
                  {/* Icono del clima */}
                  <div style={{ 
                    width: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <img
                      src={`https://openweathermap.org/img/wn/${dia.weather[0]?.icon}@2x.png`}
                      alt={dia.weather[0]?.description || ''}
                      style={{ 
                        width: '40px', 
                        height: '40px',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                      }}
                    />
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#546e7a',
                      textAlign: 'center',
                      marginTop: '4px',
                      maxWidth: '80px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {dia.weather[0]?.description ? 
                        dia.weather[0].description.charAt(0).toUpperCase() + dia.weather[0].description.slice(1) : ''}
                    </span>
                  </div>
                  
                  {/* Temperaturas */}
                  <div style={{ 
                    flex: 1, 
                    margin: '0 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ 
                        fontSize: '14px', 
                        color: '#666',
                        minWidth: '40px',
                        textAlign: 'right'
                      }}>
                        {tempMax}°
                      </span>
                      <div style={{ 
                        height: '6px', 
                        background: '#ffcdd2',
                        borderRadius: '3px',
                        flex: 1,
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${anchoMax}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #e53935, #f44336)',
                          borderRadius: '3px'
                        }} />
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ 
                        fontSize: '14px', 
                        color: '#666',
                        minWidth: '40px',
                        textAlign: 'right'
                      }}>
                        {tempMin}°
                      </span>
                      <div style={{ 
                        height: '6px', 
                        background: '#e3f2fd',
                        borderRadius: '3px',
                        flex: 1,
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${anchoMin}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #1e88e5, #42a5f5)',
                          borderRadius: '3px'
                        }} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Detalles adicionales */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    minWidth: '120px',
                    alignItems: 'flex-end'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#666' }}>💧</span>
                      <span style={{ fontSize: '14px', color: '#333', minWidth: '30px', textAlign: 'left' }}>
                        {dia.humidity}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#666' }}>💨</span>
                      <span style={{ fontSize: '14px', color: '#333', minWidth: '30px', textAlign: 'left' }}>
                        {Math.round(dia.wind_speed)} m/s
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#666' }}>📊</span>
                      <span style={{ fontSize: '14px', color: '#333', minWidth: '30px', textAlign: 'left' }}>
                        {dia.pressure} hPa
                      </span>
                    </div>
                    {dia.pop > 0 && (
                      <div style={{ 
                        marginTop: '4px',
                        padding: '2px 8px',
                        background: '#e3f2fd',
                        color: '#1565c0',
                        borderRadius: '10px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>💧</span>
                        <span>{(dia.pop * 100).toFixed(0)}% de lluvia</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tarjetas de los próximos 5 días */}
      {!cargando && !error && fechas.slice(1).length > 0 && (
        <div className="clima-contenedor clima-contenedor-horizontal">
          {fechas.slice(1, 6).map((fecha, idx) => {
            // Selecciona el bloque del mediodía si existe, si no el primero del día
            const bloqueDia = diasPronostico[fecha].find(b => new Date(b.dt * 1000).getHours() === 12) || diasPronostico[fecha][0];
            return (
              <div key={bloqueDia.dt} className="clima-tarjeta clima-tarjeta-horizontal">
                <div className="clima-titulo clima-titulo-horizontal">
                  {new Date(bloqueDia.dt * 1000).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
                </div>
                <img
                  src={`https://openweathermap.org/img/wn/${bloqueDia.weather[0]?.icon}@4x.png`}
                  alt={bloqueDia.weather[0]?.description || ''}
                  className="clima-img-horizontal"
                />
                <div className="clima-temp-horizontal">{Math.round(bloqueDia.main.temp)}°C</div>
                <div className="clima-desc-horizontal">{bloqueDia.weather[0]?.description ? bloqueDia.weather[0].description.charAt(0).toUpperCase() + bloqueDia.weather[0].description.slice(1) : ''}</div>
                <div className="clima-detalle-horizontal">
                  <b>Humedad:</b> {bloqueDia.main.humidity}%<br />
                  <b>Viento:</b> {bloqueDia.wind.speed} m/s
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Exportamos el componente Clima para que pueda ser usado en otras partes de la aplicación.
export default Clima;
