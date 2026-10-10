// ============================================================
//  Matrices: Gauss-Jordan (sistemas lineales) y Matriz Inversa
//  Aritmética exacta con fracciones (BigInt) para evitar errores
//  de redondeo y poder validar el procedimiento a mano.
// ============================================================

const DIM_MAX = 8;

// Nombres de las variables: x, y, z y luego w, v, u, t, s
const NOMBRES_VAR = ['x', 'y', 'z', 'w', 'v', 'u', 't', 's'];
const nombreVar = j => NOMBRES_VAR[j];

// Simplificación de un resultado: si es fracción, la muestra reducida y como número mixto
function simplificacion(v) {
    if (v.d === 1n) return 'Es un número entero (no requiere simplificar)';
    const negativo = v.n < 0n;
    const n = negativo ? -v.n : v.n;
    const entero = n / v.d;
    const resto = n % v.d;
    const signo = negativo ? '−' : '';
    const reducida = `${signo}${n}/${v.d}`;
    if (entero === 0n) return `Fracción irreducible: ${reducida}`;
    return `${reducida} = ${signo}${entero} ${resto}/${v.d} (fracción irreducible)`;
}

// ---------------- Fracciones exactas ----------------
function mcd(a, b) {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b) { [a, b] = [b, a % b]; }
    return a;
}

class Frac {
    constructor(n, d = 1n) {
        if (d === 0n) throw new Error("División por cero");
        if (d < 0n) { n = -n; d = -d; }
        const g = mcd(n, d) || 1n;
        this.n = n / g;
        this.d = d / g;
    }
    add(o) { return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
    sub(o) { return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
    mul(o) { return new Frac(this.n * o.n, this.d * o.d); }
    div(o) { return new Frac(this.n * o.d, this.d * o.n); }
    neg() { return new Frac(-this.n, this.d); }
    abs() { return new Frac(this.n < 0n ? -this.n : this.n, this.d); }
    isZero() { return this.n === 0n; }
    isOne() { return this.n === 1n && this.d === 1n; }
    isNeg() { return this.n < 0n; }
    equals(o) { return this.n === o.n && this.d === o.d; }
    toString() { return this.d === 1n ? String(this.n) : `${this.n}/${this.d}`; }
    toDecimal() {
        const v = Number(this.n) / Number(this.d);
        return String(parseFloat(v.toFixed(4)));
    }
}

const CERO = new Frac(0n);
const UNO = new Frac(1n);

// Convierte "3", "-2.5", "1/2", "0,75" a fracción. Devuelve null si no es válido.
function parsearFrac(texto) {
    let t = String(texto).trim().replace(',', '.');
    if (t === '') return null;
    const partes = t.split('/');
    if (partes.length > 2) return null;
    const a = parsearDecimal(partes[0]);
    if (a === null) return null;
    if (partes.length === 1) return a;
    const b = parsearDecimal(partes[1]);
    if (b === null || b.isZero()) return null;
    return a.div(b);
}

function parsearDecimal(s) {
    s = s.trim();
    if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
    let signo = 1n;
    if (s[0] === '-') { signo = -1n; s = s.slice(1); }
    else if (s[0] === '+') { s = s.slice(1); }
    const [ent, dec = ''] = s.split('.');
    const num = BigInt((ent || '0') + dec);
    const den = 10n ** BigInt(dec.length);
    return new Frac(signo * num, den);
}

// Operandos para describir operaciones: "(3/2)·" o "" si es 1
function coefTxt(f) {
    if (f.isOne()) return '';
    return f.d === 1n && !f.isNeg() ? `${f}·` : `(${f})·`;
}

function parTxt(f) {
    return f.d === 1n && !f.isNeg() ? `${f}` : `(${f})`;
}

// ---------------- Menú y carga de módulos ----------------
document.addEventListener('DOMContentLoaded', () => {
    const menuBtns = document.querySelectorAll('.menu-btn');
    menuBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const submenu = this.nextElementSibling;
            submenu.style.display = submenu.style.display === "block" ? "none" : "block";
        });
    });

    const ejercicioBtns = document.querySelectorAll('.ejercicio-btn');
    ejercicioBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            ejercicioBtns.forEach(b => b.classList.remove('activo'));
            this.classList.add('activo');
            cargarEjercicio(this.getAttribute('data-ejercicio'));
        });
    });
});

function cargarEjercicio(id) {
    const area = document.getElementById('area-ejercicio');
    area.classList.remove('bienvenida');
    let html = '';

    switch (id) {
        case 'sis1':
            html = `
                <h2 class="titulo-ejercicio">Sistemas Lineales · Método de Gauss-Jordan</h2>
                <p class="texto-centrado">Defina el tamaño del sistema: <b>m</b> ecuaciones con <b>n</b> incógnitas (máximo ${DIM_MAX}). Acepta enteros, decimales y fracciones (ej: 3, -2.5, 1/2).</p>
                <div class="controles">
                    <div class="grupo-input"><label>Ecuaciones (m):</label><input type="number" id="sis-m" class="input-corto" min="1" max="${DIM_MAX}" value="3"></div>
                    <div class="grupo-input"><label>Incógnitas (n):</label><input type="number" id="sis-n" class="input-corto" min="1" max="${DIM_MAX}" value="3"></div>
                    <button class="btn-ejecutar" id="btn-accion">Generar Matriz</button>
                </div>
                <div id="zona-entrada"></div>
                <div id="zona-resultado"></div>
                <div id="zona-historial" class="zona-historial"></div>
            `;
            break;
        case 'inv1':
            html = `
                <h2 class="titulo-ejercicio">Matriz Inversa · Método [A | I]</h2>
                <p class="texto-centrado">Defina la dimensión de la matriz cuadrada <b>n × n</b> (máximo ${DIM_MAX}). Se valida que el determinante sea distinto de cero antes de invertir.</p>
                <div class="controles">
                    <div class="grupo-input"><label>Dimensión (n):</label><input type="number" id="inv-n" class="input-corto" min="1" max="${DIM_MAX}" value="3"></div>
                    <button class="btn-ejecutar" id="btn-accion">Generar Matriz</button>
                </div>
                <div id="zona-entrada"></div>
                <div id="zona-resultado"></div>
                <div id="zona-historial" class="zona-historial"></div>
            `;
            break;
    }

    area.innerHTML = html;

    const btnAccion = document.getElementById('btn-accion');
    if (btnAccion) {
        switch (id) {
            case 'sis1': btnAccion.addEventListener('click', generarEntradaSistema); break;
            case 'inv1': btnAccion.addEventListener('click', generarEntradaInversa); break;
        }
        btnAccion.click(); // genera la cuadrícula inicial con los valores por defecto

        // Historial guardado en el navegador y restauración del último cálculo
        const tipo = id === 'sis1' ? 'sistema' : 'inversa';
        renderHistorial(tipo);
        const ultimo = lsLeer().find(r => r.tipo === tipo);
        if (ultimo) abrirRegistro(ultimo.id, false);
    }
}

// ---------------- Utilidades de interfaz ----------------
function leerDimension(idInput, nombre) {
    const val = document.getElementById(idInput).value;
    const n = parseInt(val);
    if (val === '' || isNaN(n) || n < 1 || n > DIM_MAX) {
        alert(`Atención: ${nombre} debe ser un entero entre 1 y ${DIM_MAX}.`);
        return null;
    }
    return n;
}

// Construye la cuadrícula de inputs. sepCol: índice de la columna que lleva separador (matriz aumentada)
function construirCuadricula(filas, cols, prefijo, encabezados, sepCol) {
    let html = '<div class="entrada-matriz"><table class="tabla-entrada"><thead><tr><th></th>';
    encabezados.forEach((h, j) => {
        html += `<th class="${j === sepCol ? 'sep-aug-entrada' : ''}">${h}</th>`;
    });
    html += '</tr></thead><tbody>';
    for (let i = 0; i < filas; i++) {
        html += `<tr><th>F${i + 1}</th>`;
        for (let j = 0; j < cols; j++) {
            html += `<td class="${j === sepCol ? 'sep-aug-entrada' : ''}"><input type="text" inputmode="decimal" id="${prefijo}-${i}-${j}" autocomplete="off"></td>`;
        }
        html += '</tr>';
    }
    html += '</tbody></table></div>';
    return html;
}

// Lee la cuadrícula; devuelve matriz de Frac o null si hay datos inválidos
function leerCuadricula(filas, cols, prefijo) {
    const M = [];
    for (let i = 0; i < filas; i++) {
        const fila = [];
        for (let j = 0; j < cols; j++) {
            const f = parsearFrac(document.getElementById(`${prefijo}-${i}-${j}`).value);
            if (f === null) {
                alert(`Atención: Valor no válido o vacío en la fila ${i + 1}, columna ${j + 1}. Use números, decimales o fracciones (ej: 1/2).`);
                document.getElementById(`${prefijo}-${i}-${j}`).focus();
                return null;
            }
            fila.push(f);
        }
        M.push(fila);
    }
    return M;
}

function llenarCuadricula(prefijo, datos) {
    datos.forEach((fila, i) => fila.forEach((v, j) => {
        document.getElementById(`${prefijo}-${i}-${j}`).value = v;
    }));
}

function vaciarCuadricula(filas, cols, prefijo) {
    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < cols; j++) document.getElementById(`${prefijo}-${i}-${j}`).value = '';
    }
    document.getElementById('zona-resultado').innerHTML = '';
}

function botonesAccion(textoResolver) {
    return `
        <div class="controles">
            <button class="btn-ejecutar sin-margen" id="btn-resolver">${textoResolver}</button>
            <button class="btn-ejecutar btn-secundario sin-margen" id="btn-ejemplo">Cargar Ejemplo</button>
            <button class="btn-ejecutar btn-secundario sin-margen" id="btn-limpiar">Limpiar</button>
        </div>
    `;
}

// ---------------- Render de matrices y pasos ----------------
function renderMatriz(M, opciones = {}) {
    const { sep = -1, pivote = null, filas = [] } = opciones;
    let html = '<div class="matriz-wrap"><table class="matriz-tabla"><tbody>';
    M.forEach((fila, i) => {
        html += `<tr class="${filas.includes(i) ? 'fila-resaltada' : ''}"><th class="etq-fila">F${i + 1}</th>`;
        fila.forEach((v, j) => {
            const clases = [];
            if (sep >= 0 && j === sep) clases.push('sep-aug');
            if (pivote && pivote.r === i && pivote.c === j) clases.push('celda-pivote');
            html += `<td class="${clases.join(' ')}" title="${v.toDecimal()}">${v}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
}

function renderPasos(pasos, sep) {
    return pasos.map(p => `
        <div class="paso">
            <div class="paso-cabecera">
                <span class="paso-num">${p.titulo}</span>
                <span class="paso-op">${p.op}</span>
            </div>
            <p class="paso-desc">${p.desc}</p>
            ${renderMatriz(p.matriz, { sep, pivote: p.pivote, filas: p.filas })}
        </div>
    `).join('');
}

const LEYENDA = `<p class="leyenda"><span class="muestra pivote"></span>Pivote <span class="muestra fila"></span>Fila modificada</p>`;

const copiar = M => M.map(f => f.slice());

// ---------------- Núcleo: Eliminación de Gauss-Jordan ----------------
// M: matriz aumentada (se modifica). nVars: columnas que corresponden a coeficientes.
// Devuelve { pasos, pivotes: [{fila, col}] }
function gaussJordan(M, nVars) {
    const m = M.length;
    const pasos = [];
    const pivotes = [];
    let num = 0;

    pasos.push({
        titulo: 'Paso 0', op: 'Matriz inicial',
        desc: 'Matriz aumentada de partida.',
        matriz: copiar(M), pivote: null, filas: []
    });

    let r = 0;
    for (let c = 0; c < nVars && r < m; c++) {
        // Buscar pivote no nulo en la columna c desde la fila r
        let p = -1;
        for (let i = r; i < m; i++) {
            if (!M[i][c].isZero()) { p = i; break; }
        }
        if (p === -1) {
            num++;
            pasos.push({
                titulo: `Paso ${num}`, op: `Columna ${c + 1} sin pivote`,
                desc: `No hay elementos distintos de cero en la columna ${c + 1} desde la fila ${r + 1}; se pasa a la siguiente columna (esta variable quedará libre).`,
                matriz: copiar(M), pivote: null, filas: []
            });
            continue;
        }

        // Intercambio de filas
        if (p !== r) {
            [M[r], M[p]] = [M[p], M[r]];
            num++;
            pasos.push({
                titulo: `Paso ${num}`, op: `F${r + 1} ↔ F${p + 1}`,
                desc: `Intercambio de filas: la fila ${p + 1} aporta un pivote distinto de cero en la columna ${c + 1}.`,
                matriz: copiar(M), pivote: { r, c }, filas: [r, p]
            });
        }

        // Normalizar pivote a 1
        const piv = M[r][c];
        if (!piv.isOne()) {
            const inv = UNO.div(piv);
            M[r] = M[r].map(v => v.mul(inv));
            num++;
            pasos.push({
                titulo: `Paso ${num}`, op: `F${r + 1} ← ${parTxt(inv)}·F${r + 1}`,
                desc: `Se multiplica la fila ${r + 1} por el inverso del pivote (${piv}) para obtener un 1 en la posición (${r + 1}, ${c + 1}).`,
                matriz: copiar(M), pivote: { r, c }, filas: [r]
            });
        }

        // Eliminar el resto de la columna (arriba y abajo)
        for (let i = 0; i < m; i++) {
            if (i === r || M[i][c].isZero()) continue;
            const f = M[i][c];
            const fila = M[i].map((v, j) => v.sub(f.mul(M[r][j])));
            M[i] = fila;
            num++;
            const signo = f.isNeg() ? '+' : '−';
            const mag = f.abs();
            pasos.push({
                titulo: `Paso ${num}`, op: `F${i + 1} ← F${i + 1} ${signo} ${coefTxt(mag)}F${r + 1}`,
                desc: `Se hace cero el elemento (${i + 1}, ${c + 1}) = ${f} ${f.isNeg() ? 'sumando' : 'restando'} ${mag.isOne() ? '' : `${parTxt(mag)} veces `}la fila ${r + 1}.`,
                matriz: copiar(M), pivote: { r, c }, filas: [i]
            });
        }

        pivotes.push({ fila: r, col: c });
        r++;
    }
    return { pasos, pivotes };
}

// ================= MÓDULO 1: SISTEMAS DE ECUACIONES =================
function generarEntradaSistema() {
    const m = leerDimension('sis-m', 'El número de ecuaciones');
    if (m === null) return;
    const n = leerDimension('sis-n', 'El número de incógnitas');
    if (n === null) return;

    const encabezados = [];
    for (let j = 1; j <= n; j++) encabezados.push(nombreVar(j - 1));
    encabezados.push('b');

    document.getElementById('zona-entrada').innerHTML =
        `<p class="texto-centrado">Ingrese los coeficientes de cada ecuación y el término independiente (b).</p>` +
        construirCuadricula(m, n + 1, 'a', encabezados, n) +
        botonesAccion('Resolver Paso a Paso');
    document.getElementById('zona-resultado').innerHTML = '';

    document.getElementById('btn-resolver').addEventListener('click', () => resolverSistema(m, n));
    document.getElementById('btn-limpiar').addEventListener('click', () => vaciarCuadricula(m, n + 1, 'a'));
    document.getElementById('btn-ejemplo').addEventListener('click', () => {
        // Ejemplo 3x3: solución única x=5, y=3, z=-2
        document.getElementById('sis-m').value = 3;
        document.getElementById('sis-n').value = 3;
        if (m !== 3 || n !== 3) generarEntradaSistema();
        llenarCuadricula('a', [[1, 1, 1, 6], [0, 2, 5, -4], [2, 5, -1, 27]]);
        document.getElementById('zona-resultado').innerHTML = '';
    });
}

function resolverSistema(m, n, guardar = true) {
    const A = leerCuadricula(m, n + 1, 'a');
    if (A === null) return;

    const { pasos, pivotes } = gaussJordan(copiar(A), n);
    const M = pasos[pasos.length - 1].matriz;
    const nPasos = pasos.length - 1;

    // Clasificación del sistema
    let inconsistente = false;
    for (let i = 0; i < m; i++) {
        const coefCero = M[i].slice(0, n).every(v => v.isZero());
        if (coefCero && !M[i][n].isZero()) { inconsistente = true; break; }
    }

    let conclusion = '';
    let resumen = '';
    if (inconsistente) {
        resumen = 'Sin solución (inconsistente)';
        conclusion = `
            <div class="caja-resultado error">
                <h4>Sistema inconsistente (sin solución)</h4>
                <p>Se obtuvo una fila con todos los coeficientes en cero pero con término independiente distinto de cero (0 = k, con k ≠ 0).</p>
            </div>`;
    } else {
        const colPivote = pivotes.map(p => p.col);
        const libres = [];
        for (let j = 0; j < n; j++) if (!colPivote.includes(j)) libres.push(j);

        let filasTabla = '';
        if (libres.length === 0) {
            for (const p of pivotes) {
                const v = M[p.fila][n];
                filasTabla += `<tr><td>${nombreVar(p.col)}</td><td>${v}</td><td>${simplificacion(v)}</td></tr>`;
            }
            resumen = [...pivotes].sort((a, b) => a.col - b.col)
                .map(p => `${nombreVar(p.col)} = ${M[p.fila][n].toString().replace('-', '−')}`).join(', ');
            conclusion = `
                <div class="caja-resultado exito">
                    <h4>Sistema compatible determinado (solución única)</h4>
                    <p>Rango = ${pivotes.length} = número de incógnitas.</p>
                </div>
                <table class="tabla-historial">
                    <thead><tr><th>Variable</th><th>Valor</th><th>Simplificación</th></tr></thead>
                    <tbody>${filasTabla}</tbody>
                </table>`;
        } else {
            const exprs = [];
            for (const p of pivotes) {
                exprs.push({ col: p.col, txt: expresionParametrica(M, p, libres, n) });
            }
            libres.forEach(j => exprs.push({ col: j, txt: 'libre (parámetro)' }));
            exprs.sort((a, b) => a.col - b.col);
            filasTabla = exprs.map(e => `<tr><td>${nombreVar(e.col)}</td><td>${e.txt}</td></tr>`).join('');
            resumen = `Infinitas soluciones (libres: ${libres.map(j => nombreVar(j)).join(', ')})`;
            conclusion = `
                <div class="caja-resultado aviso">
                    <h4>Sistema compatible indeterminado (infinitas soluciones)</h4>
                    <p>Rango = ${pivotes.length} &lt; ${n} incógnitas. Variables libres: ${libres.map(j => nombreVar(j)).join(', ')}.</p>
                </div>
                <table class="tabla-historial">
                    <thead><tr><th>Variable</th><th>Expresión</th></tr></thead>
                    <tbody>${filasTabla}</tbody>
                </table>`;
        }
    }

    document.getElementById('zona-resultado').innerHTML = `
        <h3 class="titulo-resultados">Matriz aumentada [A | b]</h3>
        ${renderMatriz(A, { sep: n })}
        <h3 class="titulo-resultados">Procedimiento paso a paso (${nPasos} ${nPasos === 1 ? 'paso' : 'pasos'})</h3>
        ${LEYENDA}
        ${renderPasos(pasos, n)}
        <h3 class="titulo-resultados">Resultado</h3>
        ${conclusion}
    `;

    if (guardar) {
        guardarCalculo({ tipo: 'sistema', m, n, datos: A.map(f => f.map(String)), resumen });
        renderHistorial('sistema');
    }
}

// x_pivote = b − Σ (coef · x_libre)
function expresionParametrica(M, p, libres, n) {
    const b = M[p.fila][n];
    const terminos = [];
    libres.forEach(j => {
        const a = M[p.fila][j];
        if (!a.isZero()) terminos.push({ c: a.neg(), j });
    });
    let s = '';
    if (!b.isZero() || terminos.length === 0) s = String(b);
    terminos.forEach(t => {
        const mag = t.c.abs();
        const txt = `${mag.isOne() ? '' : parTxt(mag) + '·'}${nombreVar(t.j)}`;
        if (s === '') s = (t.c.isNeg() ? '−' : '') + txt;
        else s += (t.c.isNeg() ? ' − ' : ' + ') + txt;
    });
    return s;
}

// ================= MÓDULO 2: MATRIZ INVERSA =================
function generarEntradaInversa() {
    const n = leerDimension('inv-n', 'La dimensión de la matriz');
    if (n === null) return;

    const encabezados = [];
    for (let j = 1; j <= n; j++) encabezados.push(`c${j}`);

    document.getElementById('zona-entrada').innerHTML =
        `<p class="texto-centrado">Ingrese los elementos de la matriz A (${n} × ${n}).</p>` +
        construirCuadricula(n, n, 'a', encabezados, -1) +
        botonesAccion('Calcular Inversa');
    document.getElementById('zona-resultado').innerHTML = '';

    document.getElementById('btn-resolver').addEventListener('click', () => calcularInversa(n));
    document.getElementById('btn-limpiar').addEventListener('click', () => vaciarCuadricula(n, n, 'a'));
    document.getElementById('btn-ejemplo').addEventListener('click', () => {
        document.getElementById('inv-n').value = 3;
        if (n !== 3) generarEntradaInversa();
        llenarCuadricula('a', [[2, 1, 1], [1, 3, 2], [1, 0, 0]]);
        document.getElementById('zona-resultado').innerHTML = '';
    });
}

// Determinante por eliminación hacia adelante, registrando cada operación
function determinanteConPasos(A) {
    const n = A.length;
    const M = copiar(A);
    const pasos = [];
    let signo = 1;
    let num = 0;

    pasos.push({
        titulo: 'Paso 0', op: 'Matriz inicial',
        desc: 'Se lleva la matriz a forma triangular superior. Sumar/restar múltiplos de una fila no cambia el determinante; cada intercambio de filas lo multiplica por −1.',
        matriz: copiar(M), pivote: null, filas: []
    });

    let cero = false;
    for (let c = 0; c < n && !cero; c++) {
        let p = -1;
        for (let i = c; i < n; i++) if (!M[i][c].isZero()) { p = i; break; }
        if (p === -1) {
            num++;
            pasos.push({
                titulo: `Paso ${num}`, op: `Columna ${c + 1} sin pivote`,
                desc: `Todos los elementos de la columna ${c + 1} desde la fila ${c + 1} son cero, por lo tanto det(A) = 0.`,
                matriz: copiar(M), pivote: null, filas: []
            });
            cero = true;
            break;
        }
        if (p !== c) {
            [M[c], M[p]] = [M[p], M[c]];
            signo = -signo;
            num++;
            pasos.push({
                titulo: `Paso ${num}`, op: `F${c + 1} ↔ F${p + 1}`,
                desc: `Intercambio de filas (el determinante cambia de signo; signo acumulado: ${signo === 1 ? '+1' : '−1'}).`,
                matriz: copiar(M), pivote: { r: c, c }, filas: [c, p]
            });
        }
        for (let i = c + 1; i < n; i++) {
            if (M[i][c].isZero()) continue;
            const f = M[i][c].div(M[c][c]);
            M[i] = M[i].map((v, j) => v.sub(f.mul(M[c][j])));
            num++;
            const sg = f.isNeg() ? '+' : '−';
            const mag = f.abs();
            pasos.push({
                titulo: `Paso ${num}`, op: `F${i + 1} ← F${i + 1} ${sg} ${coefTxt(mag)}F${c + 1}`,
                desc: `Se anula el elemento (${i + 1}, ${c + 1}) usando el pivote ${M[c][c]} de la fila ${c + 1}.`,
                matriz: copiar(M), pivote: { r: c, c }, filas: [i]
            });
        }
    }

    let det = CERO;
    if (!cero) {
        det = signo === 1 ? UNO : UNO.neg();
        for (let i = 0; i < n; i++) det = det.mul(M[i][i]);
    }
    return { det, pasos, triangular: M, signo, cero };
}

function calcularInversa(n, guardar = true) {
    const A = leerCuadricula(n, n, 'a');
    if (A === null) return;

    const { det, pasos: pasosDet, triangular, signo, cero } = determinanteConPasos(A);

    let explicacionDet = '';
    if (cero) {
        explicacionDet = 'Se encontró una columna sin pivote, por lo que det(A) = 0.';
    } else {
        const diag = triangular.map((f, i) => parTxt(f[i])).join(' · ');
        explicacionDet = `det(A) = (${signo === 1 ? '+1' : '−1'}) · ${diag} = <b>${det}</b>`;
    }

    let html = `
        <h3 class="titulo-resultados">Matriz A</h3>
        ${renderMatriz(A)}
        <h3 class="titulo-resultados">Paso 1: Validación de inversibilidad (determinante)</h3>
        ${LEYENDA}
        ${renderPasos(pasosDet, -1)}
        <div class="caja-resultado ${det.isZero() ? 'error' : 'exito'}">
            <h4>${explicacionDet}</h4>
            <p>${det.isZero()
                ? 'El determinante es igual a cero: la matriz es singular y <b>NO tiene inversa</b>.'
                : 'El determinante es distinto de cero: la matriz es <b>inversible</b>. Se procede a calcular A⁻¹.'}</p>
        </div>
    `;

    if (!det.isZero()) {
        // Matriz aumentada [A | I]
        const aug = A.map((fila, i) => [...fila, ...Array.from({ length: n }, (_, j) => (i === j ? UNO : CERO))]);
        const { pasos } = gaussJordan(copiar(aug), n);
        const final = pasos[pasos.length - 1].matriz;
        const inversa = final.map(f => f.slice(n));
        const nPasos = pasos.length - 1;

        html += `
            <h3 class="titulo-resultados">Paso 2: Gauss-Jordan sobre [A | I] (${nPasos} ${nPasos === 1 ? 'paso' : 'pasos'})</h3>
            <p class="texto-centrado">Se transforma [A | I] en [I | A⁻¹] con operaciones elementales de fila.</p>
            ${LEYENDA}
            ${renderPasos(pasos, n)}
            <h3 class="titulo-resultados">Matriz inversa A⁻¹</h3>
            <div class="caja-resultado exito"><h4>A⁻¹ (valores exactos)</h4></div>
            ${renderMatriz(inversa)}
            <h3 class="titulo-resultados">Simplificación de la inversa</h3>
            ${renderSimplificacionInversa(inversa)}
            <h3 class="titulo-resultados">Comprobación: A · A⁻¹ = I</h3>
            ${renderComprobacion(A, inversa)}
        `;
    }

    document.getElementById('zona-resultado').innerHTML = html;

    if (guardar) {
        const resumen = det.isZero()
            ? 'det(A) = 0 · no tiene inversa'
            : `det(A) = ${String(det).replace('-', '−')} · A⁻¹ calculada`;
        guardarCalculo({ tipo: 'inversa', m: n, n, datos: A.map(f => f.map(String)), resumen });
        renderHistorial('inversa');
    }
}

function renderSimplificacionInversa(inversa) {
    const filas = [];
    inversa.forEach((fila, i) => fila.forEach((v, j) => {
        if (v.d !== 1n) filas.push(`<tr><td>A⁻¹(${i + 1}, ${j + 1})</td><td>${v}</td><td>${simplificacion(v)}</td></tr>`);
    }));
    if (filas.length === 0) {
        return '<div class="caja-resultado exito"><p>Todos los elementos de A⁻¹ son números enteros, no hay fracciones que simplificar.</p></div>';
    }
    return `
        <p class="texto-centrado">Los elementos fraccionarios de A⁻¹ se muestran en su forma irreducible (numerador y denominador divididos por su máximo común divisor) y como número mixto.</p>
        <table class="tabla-historial">
            <thead><tr><th>Elemento</th><th>Valor</th><th>Simplificación</th></tr></thead>
            <tbody>${filas.join('')}</tbody>
        </table>`;
}

function renderComprobacion(A, inversa) {
    const n = A.length;
    const P = multiplicar(A, inversa);
    const ok = esIdentidad(P);

    let detalle = '';
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const terminos = [];
            for (let k = 0; k < n; k++) terminos.push(`${parTxt(A[i][k])}·${parTxt(inversa[k][j])}`);
            const esperado = i === j ? UNO : CERO;
            const bien = P[i][j].equals(esperado);
            detalle += `<tr>
                <td>(${i + 1}, ${j + 1})</td>
                <td style="text-align:left">F${i + 1} de A × C${j + 1} de A⁻¹ = ${terminos.join(' + ')}</td>
                <td><b>${P[i][j]}</b></td>
                <td>${bien ? '✔' : '✘'}</td>
            </tr>`;
        }
    }

    return `
        <p class="texto-centrado">Si A⁻¹ es realmente la inversa de A, al multiplicarlas debe resultar la <b>matriz identidad I</b> (unos en la diagonal principal y ceros en el resto).</p>
        <div class="comprobacion-fila">
            <div><p class="texto-centrado"><b>A</b></p>${renderMatriz(A)}</div>
            <span class="comprobacion-signo">·</span>
            <div><p class="texto-centrado"><b>A⁻¹</b></p>${renderMatriz(inversa)}</div>
            <span class="comprobacion-signo">=</span>
            <div><p class="texto-centrado"><b>A · A⁻¹</b></p>${renderMatriz(P)}</div>
        </div>
        <details ${n <= 3 ? 'open' : ''}>
            <summary class="detalle-resumen">Ver cómo se calcula cada elemento del producto</summary>
            <p class="texto-centrado">Cada elemento (i, j) se obtiene multiplicando la fila i de A por la columna j de A⁻¹, elemento a elemento, y sumando los resultados.</p>
            <table class="tabla-historial">
                <thead><tr><th>Posición</th><th>Operación (fila × columna)</th><th>Resultado</th><th></th></tr></thead>
                <tbody>${detalle}</tbody>
            </table>
        </details>
        <div class="caja-resultado ${ok ? 'exito' : 'error'}">
            <h4>${ok ? 'Comprobación exitosa' : 'La comprobación falló'}</h4>
            <p>${ok
                ? `Los ${n * n} elementos coinciden con la matriz identidad (diagonal = 1, resto = 0), por lo tanto A⁻¹ es la inversa correcta de A.`
                : 'El producto no es la matriz identidad; revise los datos ingresados.'}</p>
        </div>
    `;
}

function multiplicar(A, B) {
    const n = A.length;
    const P = [];
    for (let i = 0; i < n; i++) {
        const fila = [];
        for (let j = 0; j < n; j++) {
            let s = CERO;
            for (let k = 0; k < n; k++) s = s.add(A[i][k].mul(B[k][j]));
            fila.push(s);
        }
        P.push(fila);
    }
    return P;
}

function esIdentidad(M) {
    return M.every((fila, i) => fila.every((v, j) => (i === j ? v.isOne() : v.isZero())));
}


// ================= GUARDADO EN EL NAVEGADOR (localStorage) =================
const LS_CLAVE = 'matrices_historial_v1';
const MAX_HISTORIAL = 30;

// Todas las operaciones van en try/catch: el navegador puede bloquear el almacenamiento
function lsLeer() {
    try {
        const datos = JSON.parse(localStorage.getItem(LS_CLAVE));
        return Array.isArray(datos) ? datos : [];
    } catch (e) {
        return [];
    }
}

function lsEscribir(lista) {
    try {
        localStorage.setItem(LS_CLAVE, JSON.stringify(lista));
        return true;
    } catch (e) {
        return false;
    }
}

function lsDisponible() {
    try {
        const k = '__prueba__';
        localStorage.setItem(k, '1');
        localStorage.removeItem(k);
        return true;
    } catch (e) {
        return false;
    }
}

function guardarCalculo(reg) {
    reg.id = Date.now();
    const clave = JSON.stringify([reg.tipo, reg.m, reg.n, reg.datos]);
    // Si el mismo cálculo ya estaba guardado, se reemplaza por el más reciente
    const lista = lsLeer().filter(r => JSON.stringify([r.tipo, r.m, r.n, r.datos]) !== clave);
    lista.unshift(reg);
    return lsEscribir(lista.slice(0, MAX_HISTORIAL));
}

function esc(texto) {
    return String(texto).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderHistorial(tipo) {
    const zona = document.getElementById('zona-historial');
    if (!zona) return;

    let html = '<h3 class="titulo-resultados">Historial guardado en este navegador</h3>';
    if (!lsDisponible()) {
        zona.innerHTML = html + '<p class="leyenda">El navegador no permite guardar datos (almacenamiento bloqueado), por eso no se conservarán los resultados.</p>';
        return;
    }

    const lista = lsLeer().filter(r => r.tipo === tipo);
    if (lista.length === 0) {
        zona.innerHTML = html + '<p class="leyenda">Aún no hay cálculos guardados. Cada resultado se guarda automáticamente y seguirá aquí al recargar la página.</p>';
        return;
    }

    const filas = lista.map((r, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${esc(new Date(r.id).toLocaleString('es-CO'))}</td>
            <td>${esc(r.m)} × ${esc(r.n)}</td>
            <td class="resumen">${esc(r.resumen)}</td>
            <td>
                <button class="btn-mini" data-accion="ver" data-id="${esc(r.id)}">Ver</button>
                <button class="btn-mini peligro" data-accion="borrar" data-id="${esc(r.id)}">Eliminar</button>
            </td>
        </tr>`).join('');

    zona.innerHTML = html + `
        <table class="tabla-historial tabla-guardados">
            <thead><tr><th>#</th><th>Fecha</th><th>Tamaño</th><th>Resultado</th><th>Acciones</th></tr></thead>
            <tbody>${filas}</tbody>
        </table>
        <div class="controles"><button class="btn-ejecutar btn-secundario sin-margen" data-accion="vaciar">Borrar todo el historial de este módulo</button></div>
    `;

    // Un solo manejador por zona (se reasigna en cada render, no se acumulan)
    zona.onclick = (e) => {
        const btn = e.target.closest('button[data-accion]');
        if (!btn) return;
        const accion = btn.getAttribute('data-accion');
        const id = Number(btn.getAttribute('data-id'));
        if (accion === 'ver') {
            abrirRegistro(id, true);
        } else if (accion === 'borrar') {
            lsEscribir(lsLeer().filter(r => r.id !== id));
            renderHistorial(tipo);
        } else if (accion === 'vaciar') {
            if (confirm('¿Borrar todos los cálculos guardados de este módulo?')) {
                lsEscribir(lsLeer().filter(r => r.tipo !== tipo));
                renderHistorial(tipo);
            }
        }
    };
}

// Vuelve a cargar un cálculo guardado en la cuadrícula y lo recalcula (sin guardarlo otra vez)
function abrirRegistro(id, desplazar) {
    const reg = lsLeer().find(r => r.id === id);
    if (!reg || !Array.isArray(reg.datos)) return;

    if (reg.tipo === 'sistema' && document.getElementById('sis-m')) {
        document.getElementById('sis-m').value = reg.m;
        document.getElementById('sis-n').value = reg.n;
        generarEntradaSistema();
        llenarCuadricula('a', reg.datos);
        resolverSistema(reg.m, reg.n, false);
    } else if (reg.tipo === 'inversa' && document.getElementById('inv-n')) {
        document.getElementById('inv-n').value = reg.n;
        generarEntradaInversa();
        llenarCuadricula('a', reg.datos);
        calcularInversa(reg.n, false);
    } else {
        return;
    }
    if (desplazar) document.getElementById('zona-entrada').scrollIntoView({ behavior: 'smooth' });
}
