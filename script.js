let datosGlobal = [];
let etapas = [];
let etapaActual = 0;
let contadorPasos = 1;

let ldEtapas = [];
let ldEtapaActual = 0;

// --- NAVEGACIÓN ---
function mostrarSeccion(tipo) {
    document.getElementById('menu-principal').classList.add('hidden');
    if (tipo === 'shannon') document.getElementById('seccion-shannon').classList.remove('hidden');
    if (tipo === 'lynch') document.getElementById('seccion-lynch').classList.remove('hidden');
    if (tipo === 'creditos') document.getElementById('seccion-creditos').classList.remove('hidden');
}

function irAlMenu() {
    location.reload();
}

// --- SHANNON-FANO ---
function generarInputsShannon() {
    const n = parseInt(document.getElementById('sf-n-simbolos').value);
    const cs = document.getElementById('contenedor-simbolos');
    const cp = document.getElementById('contenedor-probs');
    
    cs.innerHTML = '<strong>Símbolo</strong>';
    cp.innerHTML = '<strong>Probabilidad</strong>';

    for (let i = 0; i < n; i++) {
        cs.innerHTML += `<input type="text" class="input-box sim-input" value="S${i+1}">`;
        cp.innerHTML += `<input type="text" class="input-box prob-input" placeholder="Ej: 1/4">`;
    }
    document.getElementById('sf-paso-2').classList.remove('hidden');
}

function iniciarProceso() {
    const si = document.querySelectorAll('.sim-input');
    const pi = document.querySelectorAll('.prob-input');
    datosGlobal = [];
    contadorPasos = 1;
    let sumaVerificacion = 0;

    for (let i = 0; i < pi.length; i++) {
        let v = pi[i].value;
        if (!v) { alert("Por favor, llena todas las probabilidades"); return; }
        let p = v.includes('/') ? parseFloat(v.split('/')[0]) / parseFloat(v.split('/')[1]) : parseFloat(v);
        if (isNaN(p) || p < 0) { alert("Ingresa valores numéricos válidos y positivos"); return; }
        sumaVerificacion += p;
        datosGlobal.push({ simbolo: si[i].value, prob: p, codigo: "" });
    }

    if (Math.abs(1 - sumaVerificacion) > 0.0001) {
        alert(`La suma de las probabilidades debe ser exactamente 1.\nSuma actual: ${sumaVerificacion.toFixed(4)}\nPor favor, corrige los valores.`);
        return;
    }

    datosGlobal.sort((a, b) => b.prob - a.prob);
    etapas = [];
    generarEtapaVisual(JSON.parse(JSON.stringify(datosGlobal)), -1, `Paso 1: Ordenamiento`, 0, datosGlobal.length - 1);
    shannonFano(0, datosGlobal.length - 1);
    generarResultadosFinales();
    etapaActual = 0;
    document.getElementById('sf-paso-2').classList.add('hidden');
    document.getElementById('sf-visualizacion').classList.remove('hidden');
    mostrarEtapa(0);
}

function shannonFano(ini, fin) {
    if (ini >= fin) return;
    let total = 0;
    for (let i = ini; i <= fin; i++) total += datosGlobal[i].prob;
    let sumaIz = 0, difMin = total, punto = ini;
    for (let i = ini; i < fin; i++) {
        sumaIz += datosGlobal[i].prob;
        let dif = Math.abs((total - sumaIz) - sumaIz);
        if (dif < difMin) { difMin = dif; punto = i; }
    }
    contadorPasos++;
    generarEtapaVisual(JSON.parse(JSON.stringify(datosGlobal)), punto, `Paso ${contadorPasos}: División y Bits`, ini, fin);
    for (let i = ini; i <= fin; i++) datosGlobal[i].codigo += (i <= punto) ? "0" : "1";
    shannonFano(ini, punto);
    shannonFano(punto + 1, fin);
}

function generarEtapaVisual(datos, corte, titulo, ini, fin) {
    let html = `<h3>${titulo}</h3><div class="proceso-container-horizontal" style="position: relative; padding: 20px;">`;
    let sSup = 0, sInf = 0;
    const colorSuperior = "#4ee2c0"; 
    const colorInferior = "#bae6fd";

    datos.forEach((d, i) => {
        let op = (i < ini || i > fin) && corte !== -1 ? "opaco" : "";
        let estiloColor = "";
        if (corte !== -1 && op === "") {
            if (i <= corte) {
                estiloColor = `background-color: ${colorSuperior}; color: white; border-color: #0cbfbc;`;
            } else {
                estiloColor = `background-color: ${colorInferior}; color: #0369a1; border-color: #7dd3fc;`;
            }
        }
        html += `<div class="card-paso ${op}" style="${estiloColor}">
                    <div class="item-v" style="border-bottom-color: rgba(0,0,0,0.1)"><strong>${d.simbolo}</strong></div>
                    <div class="item-v" style="border-bottom-color: rgba(0,0,0,0.1)">P=${d.prob.toFixed(3)}</div>
                    <div class="item-v">Bits:${d.codigo || '-'}</div>
                </div>`;
        if (i >= ini && i <= fin) { 
            if (i <= corte) sSup += d.prob; 
            else sInf += d.prob; 
        }
    });
    html += `</div>`;

    if (corte !== -1) {
        html += `<div style="display: flex; gap: 20px; justify-content: center; margin-top: 20px;">
            <div style="background-color: ${colorSuperior}; color: white; padding: 15px; border-radius: 10px; flex: 1; max-width: 300px; border: 2px solid #0cbfbc; text-align: center; box-shadow: var(--shadow-sm);">
                <strong style="display: block; margin-bottom: 5px; text-transform: uppercase; font-size: 0.8em;">Suma Superior (Bit 0)</strong>
                <span style="font-size: 1.4em; font-weight: 700;">${sSup.toFixed(3)}</span>
            </div>
            <div style="background-color: ${colorInferior}; color: #0369a1; padding: 15px; border-radius: 10px; flex: 1; max-width: 300px; border: 2px solid #7dd3fc; text-align: center; box-shadow: var(--shadow-sm);">
                <strong style="display: block; margin-bottom: 5px; text-transform: uppercase; font-size: 0.8em;">Suma Inferior (Bit 1)</strong>
                <span style="font-size: 1.4em; font-weight: 700;">${sInf.toFixed(3)}</span>
            </div>
        </div>`;
    }
    etapas.push(html);
}

function generarResultadosFinales() {
    let H = 0, L = 0;
    let tabla = `<h3>Resultados Finales</h3><table class="tabla-final"><tr><th>Símbolo</th><th>p</th><th>Código</th><th>l</th></tr>`;
    let sumatoriaH = "", sumatoriaL = "";
    datosGlobal.forEach((d, index) => {
        let len = d.codigo.length; let p = d.prob;
        H += p * Math.log2(1 / p); L += p * len;
        let mas = (index < datosGlobal.length - 1) ? " + " : "";
        sumatoriaH += `(${p.toFixed(3)} * log2[1/${p.toFixed(3)}])${mas}`;
        sumatoriaL += `(${p.toFixed(3)} * ${len})${mas}`;
        tabla += `<tr><td>${d.simbolo}</td><td>${p.toFixed(3)}</td><td>${d.codigo}</td><td>${len}</td></tr>`;
    });
    tabla += `</table>`;
    let eficiencia = ((H / L) * 100).toFixed(2);
    let redundancia = (100 - eficiencia).toFixed(2);
    let seccionFormulas = `<div id="sf-detalle-calculos" class="hidden" style="margin-top:20px; text-align:left; background:#f0f7ff; padding:20px; border-radius:10px; border: 1px solid #2563eb; color: #333;">
            <h4>Cálculos Detallados:</h4><p><strong>1. Entropía (H):</strong></p><p style="font-family: serif; font-size: 1.1em;">H(S) = Σ [ pi * log2(1/pi) ]</p>
            <p style="font-size: 0.85em; color: #555; word-wrap: break-word;">H = ${sumatoriaH}</p><p><strong>H = ${H.toFixed(4)} bits/símbolo</strong></p>
            <hr style="border: 0.5px solid #ccc;"><p><strong>2. Longitud Promedio (L):</strong></p><p style="font-family: serif; font-size: 1.1em;">L = Σ [ pi * li ]</p>
            <p style="font-size: 0.85em; color: #555; word-wrap: break-word;">L = ${sumatoriaL}</p><p><strong>L = ${L.toFixed(4)} bits/símbolo</strong></p>
            <hr style="border: 0.5px solid #ccc;"><p><strong>3. Eficiencia (η):</strong></p><p style="font-family: serif; font-size: 1.1em;">η = (H / L) * 100</p>
            <p style="font-size: 0.9em; color: #555;">η = (${H.toFixed(4)} / ${L.toFixed(4)}) * 100</p><p><strong>η = ${eficiencia}%</strong></p>
            <hr style="border: 0.5px solid #ccc;"><p><strong>4. Redundancia (R):</strong></p><p style="font-family: serif; font-size: 1.1em;">R = 100% - η</p>
            <p style="font-size: 0.9em; color: #555;">R = 100% - ${eficiencia}%</p><p><strong>R = ${redundancia}%</strong></p></div>`;
    let stats = `<div class="stats-container"><p><strong>Entropía (H):</strong> ${H.toFixed(4)}</p><p><strong>Longitud (L):</strong> ${L.toFixed(4)}</p>
            <p><strong>Eficiencia (η):</strong> ${eficiencia}%</p><p><strong>Redundancia (R):</strong> ${redundancia}%</p>
            <button class="btn-nav" style="margin-top:10px; background:#2563eb;" onclick="toggleCalculos()">Ver Cálculos</button></div>`;
    etapas.push(tabla + stats + seccionFormulas);
}

function toggleCalculos() { document.getElementById('sf-detalle-calculos').classList.toggle('hidden'); }
function mostrarEtapa(idx) { document.getElementById('etapa-contenido').innerHTML = etapas[idx]; document.getElementById('btn-prev').disabled = (idx === 0); document.getElementById('btn-next').disabled = (idx === etapas.length - 1); }
function etapaSiguiente() { etapaActual++; mostrarEtapa(etapaActual); }
function etapaAnterior() { etapaActual--; mostrarEtapa(etapaActual); }

function llenarAleatorio() {
    const ps = document.querySelectorAll('.prob-input');
    let total = 0, valores = [];
    ps.forEach(() => {
        let v = Math.random() * 100;
        valores.push(v);
        total += v;
    });
    let sumaVerificada = 0;
    ps.forEach((input, i) => {
        let normalizado = valores[i] / total;
        if (i === ps.length - 1) {
            input.value = (1 - sumaVerificada).toFixed(3);
        } else {
            let valorFinal = parseFloat(normalizado.toFixed(3));
            input.value = valorFinal;
            sumaVerificada += valorFinal;
        }
    });
}

// --- LYNCH-DAVISSON ---
function combinatoria(n, k) {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    if (k > n / 2) k = n - k;
    let res = 1;
    for (let i = 1; i <= k; i++) res = res * (n - i + 1) / i;
    return Math.round(res);
}

function configurarModoLD(m) {
    document.getElementById('ld-selector').classList.add('hidden');
    if (m === 'codificar') document.getElementById('ld-input-cod').classList.remove('hidden');
    else document.getElementById('ld-input-dec').classList.remove('hidden');
}

function toggleEjemploLD() { document.getElementById('ld-detalle-ejemplo').classList.toggle('hidden'); }
function toggleVariables() { const modal = document.getElementById('modal-vars'); modal.style.display = (modal.style.display === "block") ? "none" : "block"; }

function generarMapaCalorHTML(n_total, q_total, rojos = []) {
    let tCalor = `<h3>Mapa de Navegación</h3><div style="overflow-x:auto;"><table class="tabla-final" style="font-size:0.75em; border-collapse: separate; border-spacing: 2px;"><tr><th>j</th><th>j-1</th>`;
    for(let cHeader = 1; cHeader <= q_total; cHeader++) tCalor += `<th>q${cHeader}</th>`;
    tCalor += `</tr>`;
    for (let f_val = n_total; f_val >= 1; f_val--) {
        let j_minus_1 = f_val - 1;
        tCalor += `<tr><td><strong>${f_val}</strong></td><td><strong>${j_minus_1}</strong></td>`;
        for (let col = 1; col <= q_total; col++) {
            let valor = combinatoria(j_minus_1, col);
            let esRojo = rojos.some(r => r.f === j_minus_1 && r.c === col);
            let style = esRojo ? "border: 4px solid red !important; font-weight:bold; color:red; box-sizing: border-box;" : "";
            tCalor += `<td style="${style}">${valor}</td>`;
        }
        tCalor += `</tr>`;
    }
    tCalor += `</table></div>`;
    return tCalor;
}

function generarTablaSecuenciaLD(N, unosEncontrados, final = false) {
    let filaPos = "", filaSec = "";
    for (let i = 1; i <= N; i++) {
        filaPos += `<td>${i}</td>`;
        let char = unosEncontrados.includes(i) ? "1" : (final ? "0" : "");
        let bg = char === "1" ? "background-color: #f9cceb;" : "";
        filaSec += `<td style="${bg}">${char}</td>`;
    }
    return `<div style="overflow-x: auto; margin-top: 15px;"><table class="tabla-final"><tr><th>Nj</th>${filaPos}</tr><tr><th>Secuencia</th>${filaSec}</tr></table></div>`;
}

function cargarACodificador(sec) {
    document.getElementById('ld-visualizacion').classList.add('hidden');
    document.getElementById('ld-etapa-contenido').innerHTML = "";
    ldEtapas = [];
    mostrarSeccion('lynch');
    configurarModoLD('codificar');
    document.getElementById('ld-secuencia').value = sec;
}

function cargarADecodificador(t, q, n) {
    document.getElementById('ld-visualizacion').classList.add('hidden');
    document.getElementById('ld-etapa-contenido').innerHTML = "";
    ldEtapas = [];
    mostrarSeccion('lynch');
    configurarModoLD('decodificar');
    document.getElementById('ld-valor-t').value = t;
    document.getElementById('ld-q-dec').value = q;
    document.getElementById('ld-n-dec').value = n;
}

function iniciarLDCodificacion() {
    const seq = document.getElementById('ld-secuencia').value;
    if (!/^[01]+$/.test(seq)) { alert("Secuencia no válida"); return; }
    ldEtapas = []; const N = seq.length; let q = 0, pos = [];
    for (let i = 0; i < N; i++) { if (seq[i] === '1') { q++; pos.push(i + 1); } }
    
    let filaPosiciones = "";
    for (let i = 1; i <= N; i++) { 
        let background = (seq[i-1] === '1') ? 'background-color: #f9cceb;' : '';
        filaPosiciones += `<td style="${background}">${i}</td>`; 
    }
    let filaSecuencia = "";
    for (let i = 0; i < N; i++) { 
        let background = (seq[i] === '1') ? 'background-color: #f9cceb;' : '';
        filaSecuencia += `<td style="${background}">${seq[i]}</td>`; 
    }

    const tablaReferenciaHTML = `<div style="overflow-x: auto; margin-top: 15px;"><table class="tabla-final"><tr><th style="background: var(--primary-color);">Nj</th>${filaPosiciones}</tr><tr><th style="background: var(--primary-color);">Secuencia</th>${filaSecuencia}</tr></table></div>`;

    ldEtapas.push(`<h3>Paso 1: Análisis</h3><div class="stats-container" style="display: flex; gap: 40px; justify-content: center; margin-bottom: 25px;"><div><strong>N - 1:</strong> ${N}</div><div><strong>q:</strong> ${q}</div></div>${tablaReferenciaHTML}`);
    
    let tVal = 0, tabla = `<h3>Paso 2: Cálculo de T</h3><table class="tabla-final"><tr><th>j</th><th>C(Nj-1, j)</th><th>Valor</th></tr>`;
    pos.forEach((p, idx) => {
        let j = idx + 1; let n_c = p - 1; let k_c = j; let c = combinatoria(n_c, k_c);
        tVal += c; tabla += `<tr><td>${j}</td><td>C(${n_c}, ${k_c})</td><td>${c}</td></tr>`;
    });
    tabla += `<tr><td colspan="2"><strong>VALOR TOTAL T</strong></td><td><strong>${tVal}</strong></td></tr></table>`;

    let resumen = `<div class="stats-container" style="margin-top:25px;"><h4>Resumen Parámetros a Transmitir:</h4><p><strong>T = </strong> ${tVal}</p><p><strong>q = </strong> ${q}</p><p><strong>L = </strong> ${N}</p></div>`;

    let ejemploHTML = "";
    if (pos.length > 0) {
        let lastIdx = pos.length - 1, plast = pos[lastIdx], nlast = plast - 1, klast = lastIdx + 1, reslast = combinatoria(nlast, klast);
        ejemploHTML = `<button class="btn-nav" style="margin-top:20px; background:#2563eb;" onclick="toggleEjemploLD()">Ver Ejemplo de Combinación</button>
            <div id="ld-detalle-ejemplo" class="hidden" style="text-align:left; background:#eff6ff; padding:20px; border-radius:10px; border: 1px solid #3b82f6; margin-top:10px; color:#1e3a8a;">
                <h4>Ejemplo de Cálculo (Última Fila):</h4>
                <p><strong>Fórmula:</strong> C(n, k) = n! / [ k! * (n-k)! ]</p>
                <p><strong>Planteamiento:</strong> C(${nlast}, ${klast}) = ${nlast}! / [ ${klast}! * (${nlast}-${klast})! ]</p>
                <p><strong>Resolución:</strong> ${nlast}! / [ ${klast}! * ${nlast-klast}! ] = ${reslast}</p>
                <p>Resultado: <strong>${reslast}</strong></p>
            </div>`;
    }

    let botonIrDecodificar = `<button onclick="cargarADecodificador(${tVal}, ${q}, ${N})" class="btn-generate" style="background: #ef4444; border: 4px solid #ef4444; color: white; margin-top: 30px; box-shadow: none;">Decodificar</button>`;

    ldEtapas.push(tabla + tablaReferenciaHTML + resumen + ejemploHTML + botonIrDecodificar);
    mostrarSeccionLD();
}

function iniciarLDDecodificacion() {
    const T_in = parseInt(document.getElementById('ld-valor-t').value);
    const n_in = parseInt(document.getElementById('ld-n-dec').value); 
    const q_in = parseInt(document.getElementById('ld-q-dec').value);
    ldEtapas = []; 
    ldEtapas.push(`<h3>Inicio</h3><div class="stats-container" style="display:flex; justify-content:space-around;"><div><strong>T:</strong> ${T_in}</div><div><strong>q:</strong> ${q_in}</div><div><strong>N-1:</strong> ${n_in}</div></div>`);
    let t_actual = T_in, q_actual = q_in, unosEncontrados = [], historialPasos = [];
    for (let paso = 1; paso <= q_in; paso++) {
        let c_sup = 0, c_inf = 0, j_encontrada = 0;
        for (let j = n_in; j >= q_actual; j--) {
            let val_j_minus_1 = combinatoria(j - 1, q_actual);
            if (t_actual >= val_j_minus_1) {
                c_sup = combinatoria(j, q_actual); c_inf = val_j_minus_1; j_encontrada = j; break;
            }
        }
        let nuevo_q = q_actual - 1, nuevo_t = t_actual - c_inf;
        unosEncontrados.push(j_encontrada);
        historialPasos.push({ paso, q: q_actual, nuevo_q, t: t_actual, c_sup, c_inf, j: j_encontrada, nuevo_t });
        let htmlPaso = `<h3>Paso ${paso}</h3>
            <div class="stats-container" style="border-left: 10px solid #2563eb; text-align: left;">
                <p><strong>q actual:</strong> ${q_actual}</p><p><strong>Nuevo q:</strong> ${q_actual} - 1 = ${nuevo_q}</p>
                <p><strong>Intervalo T:</strong> C(${j_encontrada}, ${q_actual}) > T ≥ C(${j_encontrada-1}, ${q_actual})</p>
                <p style="margin-left: 20px;">➔ ${c_sup} > ${t_actual} ≥ ${c_inf}</p>
                <p><strong>Nuevo T:</strong> ${t_actual} - ${c_inf} = ${nuevo_t}</p><p><strong>Posición de muestra no redundante:</strong> ${j_encontrada}</p>
            </div>
            ${generarMapaCalorHTML(n_in, q_in, [{f: j_encontrada, c: q_actual}, {f: j_encontrada - 1, c: q_actual}])}<h4>Secuencia parcial</h4>${generarTablaSecuenciaLD(n_in, [...unosEncontrados])}`;
        ldEtapas.push(htmlPaso);
        t_actual = nuevo_t; q_actual = nuevo_q;
    }
    ldEtapas.push(`<h3>Paso Final</h3><p>Completar las casillas restantes con 0</p>${generarTablaSecuenciaLD(n_in, unosEncontrados, true)}`);
    let secFinalStr = new Array(n_in).fill('0'); unosEncontrados.forEach(u => secFinalStr[u-1] = '1'); secFinalStr = secFinalStr.join('');
    let tablaResumen = `<h3>Resumen del proceso</h3><p>Secuencia Final: ${secFinalStr}</p><table class="tabla-final"><tr><th>Paso</th><th>j</th><th>q</th><th>Nuevo q</th><th>Intervalo T</th><th>Nuevo T</th></tr>`;
    historialPasos.forEach(h => { tablaResumen += `<tr><td>${h.paso}</td><td>${h.j}</td><td>${h.q}</td><td>${h.nuevo_q}</td><td>${h.c_sup} > ${h.t} ≥ ${h.c_inf}</td><td>${h.nuevo_t}</td></tr>`; });
    tablaResumen += `</table>${generarTablaSecuenciaLD(n_in, unosEncontrados, true)} <button onclick="cargarACodificador('${secFinalStr}')" class="btn-generate" style="background: #ef4444; border: 4px solid #ef4444; color: white; margin-top: 30px; box-shadow: none;">Codificar</button>`;
    ldEtapas.push(tablaResumen);
    mostrarSeccionLD();
}

function mostrarSeccionLD() {
    document.getElementById('ld-input-cod').classList.add('hidden');
    document.getElementById('ld-input-dec').classList.add('hidden');
    document.getElementById('ld-visualizacion').classList.remove('hidden');
    ldEtapaActual = 0; mostrarEtapaLD(0);
}

function mostrarEtapaLD(idx) {
    document.getElementById('ld-etapa-contenido').innerHTML = ldEtapas[idx];
    document.getElementById('btn-prev-ld').disabled = (idx === 0);
    document.getElementById('btn-next-ld').disabled = (idx === ldEtapas.length - 1);
}

function ldEtapaSiguiente() { ldEtapaActual++; mostrarEtapaLD(ldEtapaActual); }
function ldEtapaAnterior() { ldEtapaActual--; mostrarEtapaLD(ldEtapaActual); }