en esta carpeta vamos a trabajar en la base para un proyecto que sera una aplicacion para taxistas y personas que solicitaran el dervicio te comento lo que decidimos con mi equipo de 3 personas:



backend: Nest js

BD: Postgres + postgis (la alojamos en supabase)

Redis: ubicaciones en tiempo real (SignalR / WebSocket)

Movil: fluttler

panel admin: react vite





definimos alcance lo primero es crear el proyecto la base lo siguiente es subirlo a mi repo en GitHub lo siguiente es agregarlos como colaboradores.



bien no empezaremos con todo el proyecto de una no para ello quedamos que en notion nos delegaremos tareas a seguir para ello vamos a crearlas nosotros Tambien para ello te puedes conectar a mi mcp de notion.



ahora que es lo que tocaremos sera lo siguiente:



trabajaremos en el panel superadmin ojo el proyecto sera multitenand.



en el sidebar trabajaremos en las siguientes areas modulo:



ADMINISTRACION: 

Conductores. que tendra lo siguiente---> lista de moviles, nuevo movil, nuevo conductor, lista de conductoress, Kardex, nuevo vehiculo, lista de vehiculos, Kardex de vehiculos, socios y inquilinos, Kardex Lineas Titulares, Ficha Tecnica Linea.







DATOS PARA EL FORMULARIO DE REGISTRO/ACTUALIZACION DE CONDUCTOR.



NOMBRE,FOTO DE PERFIL, FECHA DE NACIMIENTO, DNI, FOTO IDENTIFICACION, EXPEDIDO, TELEFONO, DIRECCION.







DATOS PARA EL FORMULARIO DE CREAR VEHICULO.



PLACA,FOTO DEL VEHICULO,MARCA,MODELO,AÑO,COLOR.



<-- PARA MARCA DE VEHICULO IMPLEMENTAMOS UNA API PARA MOSTRAR LA MARCA Y DE ACUERDO A ESO QUE ME MUESTRE EL MODELO DE LA MARCA





(

DATOS DE VEHICULO



NRO MOVIL <--- "ELIJA PROPIETARIO Y TIPO DE AFILIADO (Y USUARIO DEL MOVIL SI EL CONDUCTOR ES EL PROPIETARIO)" PARA LISTAR NUMEROS DISPONIBLES.



FOTO VEHICULO



DATOS MOVIL

USUARIO DE MOVIL



GRUPO  <-- LA SELECCION DE GRUPO DEBE DE SER DINAMICO



TIPO DE MOVIL <-- seleccione uno o mas tipos 



VEHICULO <-- seleccione un vehiculo



Los siguientes campos se llenan automaticamente al seleccionar el vehiculo



Marca:

Seleccione una marca

Modelo:

Seleccione un modelo



Placa



Año Vehiculo



Color



datos del propietario



el conductor es el propietario



socio <-- seleccione un socio





nombre(s) Apellido(s)



Fecha de Ingreso dd/mm/aaaa celular



tipo de alfiliado

<-- selecione un tipo de afiliado

) <-- EL CONDUCTOR MISMO PUEDE SER EL DUEÑO DEL VEHICULO -->

FORMULARIO REGISTRO/ACTUALIZACION DE CONDUCTOR



NOMBRE,FECHA DE NACIMIENTO,DNI,FOTO DE PERFIL,FOTO DE IDENTIFICACION,EXPEDIDO <-- LOS 9 DEPARTAMENTO DE BOLIVIA, TELEFONO, DIRECCION.











