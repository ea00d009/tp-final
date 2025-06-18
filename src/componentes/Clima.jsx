// Componente principal para mostrar el pronóstico del clima
// Importamos React y los hooks necesarios
import React, { useState, useEffect } from 'react';
import './Clima.css';

// Componente funcional principal
const Clima = () => {
  // Estados principales del componente
  const [busqueda, setBusqueda] = useState('');      // Texto del input de búsqueda
  const [ciudad, setCiudad] = useState('');          // Nombre de la ciudad actual
  const [datos, setDatos] = useState(null);          // Respuesta completa de One Call 3.0
  const [cargando, setCargando] = useState(false);   // Estado de carga
  const [error, setError] = useState('');            // Mensaje de error

  // API KEY de OpenWeatherMap (One Call 3.0). Reemplazar por variable de entorno en producción.
  const API_KEY = '713e4eb8095ff565c8c9bb63babffafe';

  // Función para buscar clima usando Geocoding API y One Call 3.0
  const buscarClima = async (nombreCiudad) => {
    setCargando(true);
    setError('');
    setDatos(null);
    setCiudad('');
    try {
      // 1. Obtener lat/lon a partir del nombre de la ciudad usando la Geocoding API
      // Documentación: https://openweathermap.org/api/geocoding-api
      const respGeo = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(nombreCiudad)}&limit=1&appid=${API_KEY}`);
      if (!respGeo.ok) throw new Error('No se pudo obtener la ubicación');
      const geoData = await respGeo.json();
      if (!geoData[0]) throw new Error('Ciudad no encontrada');
      const { lat, lon, name, country, state } = geoData[0];
      setCiudad(name + (state ? ', ' + state : '') + ', ' + country);

      // 2. Llamar a la One Call 3.0 API con las coordenadas obtenidas
      // Documentación: https://openweathermap.org/api/one-call-3
      const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`;
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

  // Al montar, mostrar el clima de Buenos Aires por defecto
  useEffect(() => {
    buscarClima('Buenos Aires');
  }, []);

  // Función auxiliar para formatear fechas
  const formatearFecha = (dt, opciones = {}) => {
    return new Date(dt * 1000).toLocaleString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', ...opciones
    });
  };

  // Función auxiliar para formatear solo fecha
  const formatearSoloFecha = (dt) => {
    return new Date(dt * 1000).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' });
  };

  // Renderizado principal
  return (
    <div className="clima-principal">
      {/* Título principal */}
      <h1 style={{ color: '#fff', textShadow: 'none', marginBottom: 10 }}>Pronóstico del Clima</h1>
      {/* Información sobre la API utilizada */}
      <div style={{ color: '#e0e0e0', background: 'rgba(20,30,60,0.8)', borderRadius: 8, padding: '8px 18px', marginBottom: 22, fontSize: 15, maxWidth: 600, textAlign: 'center' }}>
        Fuente de datos: <b>OpenWeatherMap</b> &mdash; <a href="https://openweathermap.org/forecast5" target="_blank" rel="noopener noreferrer" style={{ color: '#90caf9', textDecoration: 'underline' }}>openweathermap.org</a><br />
        Pronóstico a 5 días, datos cada 3 horas. Actualización frecuente.<br />
        <span style={{ color: '#ffc107' }}>Uso gratuito, puede estar limitado en precisión y frecuencia.</span>
      </div>
      {/* Formulario de búsqueda de ciudad */}
      <form
        onSubmit={e => {
          e.preventDefault();
          if (busqueda.trim()) buscarClima(busqueda.trim());
        }}
        style={{ marginBottom: 24, display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}
      >
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar ciudad, país (ej: Cordoba, AR)"
          style={{ padding: 10, fontSize: 16, borderRadius: 8, border: '1px solid #bbb', width: 260 }}
        />
        <button
          type="submit"
          style={{ padding: '10px 18px', fontSize: 16, borderRadius: 8, background: '#1976d2', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          Buscar
        </button>
      </form>
      {/* Mensaje de error si la ciudad no existe */}
      {error && (
        <div className="clima-error">No se pudo encontrar la ciudad. Intenta con otro nombre.</div>
      )}
      {/* Mensaje de carga */}
      {cargando && (
        <div className="clima-cargando">Cargando clima...</div>
      )}
      {/* Debug: Mostrar estructura de datos en consola */}
      {!cargando && !error && datos && datos.current && 
        (() => { console.log('Datos actuales a renderizar:', datos.current); return null; })()}
      
      {/* Renderizado de datos actuales del clima */}
      {!cargando && !error && datos && datos.current && (
        <div className="clima-bloque-principal" style={{
          width: '100%',
          maxWidth: 1000,
          background: '#fff',
          borderRadius: 0,
          boxShadow: '0 6px 32px 0 #21e6c144, 0 1.5px 3px #1976d2aa',
          border: '2px solid #21e6c1',
          marginBottom: 36,
          padding: '32px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 36,
        }}>
          {/* Icono y datos principales del clima actual */}
          <img
            src={`https://openweathermap.org/img/wn/${datos.current.weather[0]?.icon}@4x.png`}
            alt={datos.current.weather[0]?.description || ''}
            style={{ width: 120, height: 120, marginRight: 32 }}
          />
          <div style={{ minWidth: 220 }}>
            <h2 style={{ fontSize: 32, marginBottom: 6, color: '#154273', textShadow: 'none' }}>{ciudad}</h2>
            <div style={{ fontSize: 18, color: '#555', marginBottom: 12 }}>{formatearFecha(datos.current.dt)}</div>
            <div style={{ fontSize: 54, fontWeight: 900, color: '#1976d2', marginBottom: 6 }}>{Math.round(datos.current.temp)}°C</div>
            <div style={{ fontSize: 20, color: '#333', marginBottom: 8 }}>{datos.current.weather[0]?.description ? datos.current.weather[0].description.charAt(0).toUpperCase() + datos.current.weather[0].description.slice(1) : ''}</div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 17, color: '#444', marginBottom: 8 }}>
              <span><b>Humedad:</b> {datos.current.humidity}%</span>
              <span><b>Viento:</b> {datos.current.wind_speed} m/s</span>
              <span><b>Presión:</b> {datos.current.pressure} hPa</span>
              <span><b>Sensación:</b> {Math.round(datos.current.feels_like)}°C</span>
              <span><b>Visibilidad:</b> {(datos.current.visibility / 1000).toFixed(1)} km</span>
              <span><b>P. rocío:</b> {Math.round(datos.current.dew_point)}°C</span>
            </div>
          </div>
        </div>
      )}

      {/* Renderizado del pronóstico horario (próximas 12 horas) */}
      {!cargando && !error && datos && datos.hourly && (
        <div style={{
          width: '100%',
          maxWidth: 1000,
          background: '#fff',
          borderRadius: 0,
          boxShadow: '0 6px 32px 0 #21e6c144',
          border: '2px solid #21e6c1',
          marginBottom: 36,
          padding: '18px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {/* Título del bloque */}
          <h3 style={{ color: '#1976d2', marginBottom: 18, marginTop: 0 }}>Pronóstico horario (12 horas)</h3>
          <div className="clima-contenedor" style={{ gap: 12 }}>
            {datos.hourly.slice(0, 12).map((hora, i) => (
              <div key={hora.dt} className="clima-tarjeta" style={{ minWidth: 110, alignItems: 'center', padding: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{new Date(hora.dt * 1000).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
                <img
                  src={`https://openweathermap.org/img/wn/${hora.weather[0]?.icon}@2x.png`}
                  alt={hora.weather[0]?.description || ''}
                  style={{ width: 40, height: 40 }}
                />
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1976d2', marginBottom: 2 }}>{Math.round(hora.temp)}°C</div>
                <div style={{ fontSize: 13, color: '#333' }}>{hora.weather[0]?.description ? hora.weather[0].description.charAt(0).toUpperCase() + hora.weather[0].description.slice(1) : ''}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}><b>Humedad:</b> {hora.humidity}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Renderizado del pronóstico diario (próximos 7 días) */}
      {!cargando && !error && datos && datos.daily && (
        <div style={{
          width: '100%',
          maxWidth: 1000,
          background: '#fff',
          borderRadius: 0,
          boxShadow: '0 6px 32px 0 #21e6c144',
          border: '2px solid #21e6c1',
          marginBottom: 36,
          padding: '18px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {/* Título del bloque */}
          <h3 style={{ color: '#1976d2', marginBottom: 18, marginTop: 0 }}>Pronóstico diario (7 días)</h3>
          <div className="clima-contenedor" style={{ gap: 12 }}>
            {datos.daily.slice(0, 7).map((dia, i) => (
              <div key={dia.dt} className="clima-tarjeta" style={{ minWidth: 140, alignItems: 'center', padding: 12 }}>
                <div className="clima-titulo" style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{formatearSoloFecha(dia.dt)}</div>
                <img
                  src={`https://openweathermap.org/img/wn/${dia.weather[0]?.icon}@2x.png`}
                  alt={dia.weather[0]?.description || ''}
                  style={{ width: 48, height: 48, marginBottom: 4 }}
                />
                <div style={{ fontSize: 19, fontWeight: 700, color: '#1976d2', marginBottom: 2 }}>{Math.round(dia.temp.max)}° / {Math.round(dia.temp.min)}°C</div>
                <div style={{ fontSize: 14, color: '#444', marginBottom: 2 }}>{dia.weather[0]?.description ? dia.weather[0].description.charAt(0).toUpperCase() + dia.weather[0].description.slice(1) : ''}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}><b>Humedad:</b> {dia.humidity}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tarjetas de los próximos 5 días */}
      {!cargando && !error && fechas.slice(1).length > 0 && (
        <div className="clima-contenedor" style={{ gap: 16, marginTop: 8, display: 'flex', flexWrap: 'nowrap', justifyContent: 'center' }}>
          {fechas.slice(1, 6).map((fecha, idx) => {
            // Selecciona el bloque del mediodía si existe, si no el primero del día
            const bloqueDia = diasPronostico[fecha].find(b => new Date(b.dt * 1000).getHours() === 12) || diasPronostico[fecha][0];
            return (
              <div key={bloqueDia.dt} className="clima-tarjeta" style={{ minWidth: 180, maxWidth: 200, background: '#fff', borderRadius: 0, boxShadow: 'none', padding: 18, alignItems: 'center', border: '1px solid #e0e0e0' }}>
                <div className="clima-titulo" style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 12 }}>
                  {new Date(bloqueDia.dt * 1000).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
                </div>
                <img
                  src={`https://openweathermap.org/img/wn/${bloqueDia.weather[0]?.icon}@4x.png`}
                  alt={bloqueDia.weather[0]?.description || ''}
                  style={{ width: 60, height: 60, marginBottom: 8 }}
                />
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1976d2', marginBottom: 4 }}>{Math.round(bloqueDia.main.temp)}°C</div>
                <div style={{ fontSize: 15, color: '#555', marginBottom: 5 }}>{bloqueDia.weather[0]?.description ? bloqueDia.weather[0].description.charAt(0).toUpperCase() + bloqueDia.weather[0].description.slice(1) : ''}</div>
                <div style={{ fontSize: 13, color: '#333' }}>
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
