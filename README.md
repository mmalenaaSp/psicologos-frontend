# PsycoGest frontend

Frontend React/Vite integrado con la API de `psicologos-backend`. Requiere Node.js 24 y las dependencias de `package-lock.json` (`npm ci` en una instalación nueva).

## Ejecutar localmente

1. Preparar el backend y una base MySQL de pruebas siguiendo su README. La aplicación no ejecuta migraciones automáticamente.
2. Copiar `.env.example` a `.env.local` si es necesario. `VITE_API_URL` apunta a `http://localhost:3000/api` por defecto; también admite `/api` si hay un proxy del mismo origen. No incluir secretos: Vite publica estas variables en el cliente.
3. Iniciar backend con `npm run dev` en su carpeta y frontend con `npm run dev` en esta carpeta. Mantener `FRONTEND_URL` del backend igual al origen mostrado por Vite; usar `localhost` en ambos.

## Registro, perfil y acceso

La pantalla inicial permite registrarse como PACIENTE o PSICOLOGO. Después del registro se inicia sesión y se muestra un formulario para completar el perfil, sin esperar una aprobación manual. Si falla el inicio automático, la cuenta ya está creada y se puede ingresar desde el login.

Una sesión con perfil incompleto sólo muestra su formulario personal y el cierre de sesión. El formulario solicita los campos obligatorios de Prisma: nombre, apellido y teléfono; para pacientes, DNI y fecha de nacimiento; para profesionales, matrícula, dirección y colegio. La obra social del paciente es opcional. Si el colegio todavía no figura entre las opciones, el profesional puede cargar sus datos al completar el perfil.

Al guardar, un psicólogo ingresa a su espacio profesional con los CRUD de pacientes, lugares y tipos de sesión. Cada registro está limitado por el backend al profesional que lo creó. La entrada **Mi perfil profesional** permite editar sus propios datos; los componentes previos del CRUD de psicólogos se conservan en el repositorio. Un paciente ingresa a **Mi portal**, donde ve y edita exclusivamente su perfil.

Crear una cuenta no vincula fichas existentes por email, DNI o matrícula. Si un identificador ya está utilizado, el servidor rechaza el guardado: no recupera ni asigna esa ficha. Los profesionales nuevos no obtienen acceso a información clínica preexistente. Los catálogos disponibles para elegir datos del perfil no incluyen fichas clínicas.

Las solicitudes envían cookies con `credentials: include`. El cliente no guarda tokens ni contraseñas en localStorage/sessionStorage. Al recargar se consulta `/auth/me`; ante una sesión vencida se vuelve al ingreso. El cierre de sesión revoca la cookie en el servidor. El servidor verifica sesión, rol y autorización sobre cada registro.

## Verificación

- `npm test`: pruebas de servicios HTTP con respuestas ficticias; incluyen operaciones CRUD, cookies, filtros, errores y revalidación de sesión.
- `npm run lint`: validación estática de JavaScript/JSX.
- `npm run build`: compilación de producción.
- `npm run test:ui`: recorrido de navegador headless con API ficticia aislada, sin utilizar MySQL. Compila una versión temporal y prueba registro, perfil incompleto, guardado, destinos por rol, edición, recarga y logout. Requiere Edge o Chrome; también admite la ruta del navegador mediante `PSYCOGEST_BROWSER`. Crea un perfil temporal independiente y lo elimina al terminar.

Para una prueba integrada con el backend real, usar únicamente una base MySQL de pruebas y datos ficticios: registrar ambos roles, completar los perfiles, confirmar que cada profesional comienza sin fichas ajenas, crear registros, recargar y cerrar sesión. Comprobar también que otra cuenta no puede consultar ni modificar esos registros. Los tests del backend cubren estos permisos; el recorrido headless de este repositorio usa respuestas simuladas.

Turnos, liquidaciones y recuperación de contraseña siguen pendientes. No se modifican masivamente los estados de cuentas existentes ni se vinculan fichas automáticamente.

## Turnos y reservas

El menú profesional incluye Mis turnos, Obras sociales y Liquidaciones. El portal del paciente incluye Buscar profesionales, Mis turnos y Mi perfil. La página inicial pública presenta los dos espacios y permite acceder al login y registro.

Verificación: `npm run lint`, `npm test`, `npm run build`, `npm run test:ui`. El smoke test usa una API ficticia; el recorrido real de reservas y concurrencia se verifica contra MySQL con `scripts/verificar-mysql.cjs` del backend.

Ambos servidores deben estar iniciados; reiniciar el backend para cargar las nuevas rutas.

## Presentación pública del profesional

Desde Mi perfil profesional se edita la sección Tu presentación pública, con foto por URL HTTPS, título, enfoque, descripción, destinatarios, idiomas, modalidad, reintegro y consultorios seleccionados. La búsqueda incluye Ver perfil y Ver disponibilidad; el detalle permite continuar con la reserva existente.

Informe de endpoints, migración, archivos y pruebas: [IMPLEMENTACION_PERFIL_PUBLICO.md](../psicologos-backend/IMPLEMENTACION_PERFIL_PUBLICO.md).
