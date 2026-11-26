<p align="right"><a href="README.md">中文</a> | <a href="README.en.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.de.md">Deutsch</a> | <a href="README.ru.md">Русский</a> | <a href="README.pt.md">Português</a></p>

# Gestión de Skills y MCP de DSH

Un plugin de la barra lateral de DSH para gestionar Skills locales y servidores MCP. La interfaz usa los tokens de tema de DSH, no incrusta un iframe y mantiene la entrada `Skills y MCP`.

El directorio global `~/.agents/skills` no entra en el catálogo de Skills del modelo. Solo los Skills sincronizados explícitamente se añaden a DSH.

![Gestión de Skills](docs/screenshots/overview.png)

## Funciones

- Buscar, crear, editar, activar, desactivar y eliminar Skills de usuario y de proyecto.
- Ocultar el directorio global Agent del catálogo del modelo y sincronizar solo los Skills elegidos.
- Sincronización por enlace simbólico o copia, visualización del modo, vista previa y copia de seguridad antes de reemplazar.
- Selección múltiple con casillas y eliminación por lotes.
- Importar paquetes de Skill `.zip` arrastrando y soltando o eligiendo un archivo.
- Editar entradas del MCP Manager y MCP independientes en formulario o JSON, probar la conexión, reconectar, importar y solicitar aprobación del Host.
- Actualización automática para instalaciones npm y notas de GitHub Releases.

## Instalación

```bash
dsh plugin --profile desktop add dsh-capability-switch
```

Para instalar desde el código, clona el repositorio, ejecuta `npm install --ignore-scripts` y selecciona el directorio en DSH desde **Plugins → Añadir plugin**. La versión actual está verificada para DSH `0.2.3-alpha.2`.

## Idiomas

La interfaz sigue **Ajustes de DSH → General → Idioma** y admite los ocho idiomas `zh`, `en`, `ja`, `es`, `fr`, `de`, `ru` y `pt`. Al cambiar el idioma, la interfaz se actualiza automáticamente.

Las listas de Skills y MCP no se traducen. Los nombres, descripciones, contenido de SKILL.md, comandos y URL se muestran en su idioma original.

## Datos y permisos

Accede a archivos locales en `~/.dsh/skills`, `~/.agents/skills`, `~/.dsh/capability-switch` y al `cordis.patch.yml` del perfil DSH activo. El acceso a la red se limita al registro npm (actualización automática) y a la API de GitHub Releases (notas de versión). No sube Skills, configuración MCP ni credenciales.

## Documentación

La documentación completa está disponible en [English](README.en.md) o [中文](README.md).

## Licencia

[MIT](LICENSE)
