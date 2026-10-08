# PromotionApp

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.1.2.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Iconos

Los iconos usan **Material Symbols Rounded** como subconjunto auto-hospedado:
`src/assets/fonts/MaterialSymbolsRounded-subset.woff2` (18 iconos, ~28 KB).
No hay peticiones a Google Fonts en runtime.

Uso en el template:

```html
<app-icon name="sell" [size]="33" [fill]="1" label="Promociones" />
```

| Input | Tipo | Default | Descripción |
| --- | --- | --- | --- |
| `name` | `IconName` | — | Obligatorio. Solo acepta los nombres de `src/app/shared/icon/icons.ts`. |
| `size` | `number` | `24` | `font-size` en píxeles. |
| `fill` | `0 \| 1` | `0` | Eje `FILL` de la fuente. |
| `weight` | `100`-`700` | `500` | Eje `wght`. |
| `grade` | `number` | `0` | Eje `GRAD`. |
| `label` | `string` | — | Nombre accesible. Sin `label` el icono queda `aria-hidden`. |

El color por defecto es `--color-primary-500`; se sobreescribe por componente con
`app-icon { color: ... }` (por ejemplo blanco sobre botones morados).

Animar el relleno desde CSS sin pasar por input:

```scss
.card:hover app-icon { --icon-fill: 1; }
```

### Agregar un icono

1. Validar que el nombre exista (404 = no existe):

   ```
   https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsrounded/<nombre>/default/24px.svg
   ```

2. Agregar la entrada en `src/app/shared/icon/icons.ts`.
3. Regenerar el subconjunto y reemplazar el `.woff2` en `src/assets/fonts/`
   (agregando el nombre a `icon_names=`):

   ```
   https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=<lista>
   ```

   Descargar la URL `url(...)` que devuelve ese CSS.

4. Usarlo en el template con `<app-icon name="..." />`. Si el nombre no está en la
   fuente, el texto literal aparece en pantalla.
