// ════════════════════════════════════════
//  CG MODULE - COMPUTER GRAPHICS ALGORITHMS
// ════════════════════════════════════════

// Helpers
function drawGrid(ctx, w, h) {
  ctx.strokeStyle = 'rgba(0,229,255,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 20) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
  for (let y = 0; y < h; y += 20) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
}

function drawAxes(ctx, w, h) {
  ctx.strokeStyle = 'rgba(100,116,139,0.3)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h); ctx.stroke();
}

function highlightCpp(code) {
  return code
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/(\/\/[^\n]*)/g, '<span style="color:#4b5563">$1</span>')
    .replace(/\b(int|float|void|return|while|for|if|else|true|false|include|define|using|namespace)\b/g, '<span style="color:#a78bfa">$1</span>')
    .replace(/\b(std|cout|endl|abs|round|max|min|cos|sin|sqrt|pow|gluOrtho2D|glVertex2f|glBegin|glEnd|glFlush|GL_LINE_STRIP|GL_LINE_LOOP|glutMainLoop|glutDisplayFunc|glutInit|glutInitWindowSize|glutCreateWindow|glClear|GL_COLOR_BUFFER_BIT|putpixel|line|rectangle|initgraph|closegraph|getch|glColor3f|glPushMatrix|glPopMatrix|glTranslatef|glRotatef|glScalef|glutWireCube|glLoadIdentity|glEnable|GL_DEPTH_TEST|glutSwapBuffers)\b/g, '<span style="color:#00e5ff">$1</span>')
    .replace(/\b(\d+\.?\d*f?)\b/g, '<span style="color:#f59e0b">$1</span>');
}

function copyCG(id) {
  const el = document.getElementById(id + 'CppCode') || document.getElementById(id + 'Code') || document.getElementById('code' + id);
  if (el) navigator.clipboard.writeText(el.textContent).then(() => { alert('Copied!'); });
}

function downloadCGCode(id) {
  const codes = {
    dda: () => document.getElementById('ddaCppCode')?.textContent,
    br: () => document.getElementById('brCppCode')?.textContent,
    mc: () => document.getElementById('mcCppCode')?.textContent,
    t2d: () => document.getElementById('t2dCode')?.textContent,
    '3d': () => document.getElementById('code3d')?.textContent,
    clip: () => document.getElementById('clipCode')?.textContent,
    bezier: () => document.getElementById('bezierCode')?.textContent,
  };
  const fn = codes[id];
  if (!fn) return;
  const content = fn();
  if (!content) return;
  const blob = new Blob([content], {type:'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `virtulab_${id}.cpp`;
  a.click();
}

// DDA
function drawDDA() {
  const canvas = document.getElementById('ddaCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const x1 = parseInt(document.getElementById('ddaX1').value);
  const y1 = parseInt(document.getElementById('ddaY1').value);
  const x2 = parseInt(document.getElementById('ddaX2').value);
  const y2 = parseInt(document.getElementById('ddaY2').value);
  const color = document.getElementById('ddaColor').value;

  ctx.fillStyle = '#050709'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx, canvas.width, canvas.height);
  drawAxes(ctx, canvas.width, canvas.height);

  const dx = x2 - x1, dy = y2 - y1;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  const xInc = dx / steps, yInc = dy / steps;
  let x = x1, y = y1;
  const pts = [];

  ctx.fillStyle = color;
  for (let i = 0; i <= steps; i++) {
    const px = Math.round(x), py = Math.round(y);
    ctx.fillRect(px - 1, py - 1, 2, 2);
    pts.push({ x: px, y: py, xInc: xInc.toFixed(3), yInc: yInc.toFixed(3) });
    x += xInc; y += yInc;
  }

  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(x1, y1, 4, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x2, y2, 4, 0, Math.PI*2); ctx.stroke();

  const stepsWrap = document.getElementById('ddaSteps');
  stepsWrap.innerHTML = pts.slice(0, 12).map((p, i) => 
    `<div style="color:var(--text)">Step ${i}: x=${p.x}, y=${p.y} <span style="color:var(--muted)">(Δx=${p.xInc}, Δy=${p.yInc})</span></div>`
  ).join('') + (pts.length > 12 ? `<div style="color:var(--muted)">...${pts.length - 12} more steps</div>` : '');

  const code = generateDDACode(x1, y1, x2, y2);
  document.getElementById('ddaCppCode').innerHTML = highlightCpp(code);
}

function generateDDACode(x1, y1, x2, y2) {
  return `// DDA Line Drawing Algorithm
// VirtuLab — Computer Graphics Module
// Generated for: (${x1},${y1}) → (${x2},${y2})

#include <graphics.h>
#include <cmath>
#include <iostream>
using namespace std;

void DDA(int x1, int y1, int x2, int y2) {
    int dx = x2 - x1;
    int dy = y2 - y1;
    int steps = max(abs(dx), abs(dy));
    
    float xInc = (float)dx / steps;
    float yInc = (float)dy / steps;
    
    float x = x1, y = y1;
    
    for (int i = 0; i <= steps; i++) {
        putpixel(round(x), round(y), WHITE);
        x += xInc;
        y += yInc;
    }
}

int main() {
    int gd = DETECT, gm;
    initgraph(&gd, &gm, "");
    
    DDA(${x1}, ${y1}, ${x2}, ${y2});
    
    getch();
    closegraph();
    return 0;
}`;
}

// Bresenham
function drawBresenham() {
  const canvas = document.getElementById('brCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let x1 = parseInt(document.getElementById('brX1').value);
  let y1 = parseInt(document.getElementById('brY1').value);
  let x2 = parseInt(document.getElementById('brX2').value);
  let y2 = parseInt(document.getElementById('brY2').value);
  const color = document.getElementById('brColor').value;

  ctx.fillStyle = '#050709'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx, canvas.width, canvas.height);
  drawAxes(ctx, canvas.width, canvas.height);

  let dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
  let sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  const pts = [], steps = [];
  let x = x1, y = y1;

  ctx.fillStyle = color;
  for (let i = 0; i < 1000; i++) {
    ctx.fillRect(x - 1, y - 1, 2, 2);
    pts.push([x, y]);
    const e2 = 2 * err;
    const step = { x, y, err, e2 };
    steps.push(step);
    if (x === x2 && y === y2) break;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }

  document.getElementById('brSteps').innerHTML = steps.slice(0, 10).map((s, i) =>
    `<div>Step ${i}: (${s.x},${s.y}) err=${s.err} 2e=${s.e2}</div>`
  ).join('');

  const code = generateBresenhamCode(x1, y1, x2, y2);
  document.getElementById('brCppCode').innerHTML = highlightCpp(code);
}

function generateBresenhamCode(x1, y1, x2, y2) {
  return `// Bresenham Line Drawing Algorithm
// VirtuLab — Computer Graphics Module
// Generated for: (${x1},${y1}) → (${x2},${y2})

#include <graphics.h>
#include <cmath>
using namespace std;

void Bresenham(int x1, int y1, int x2, int y2) {
    int dx = abs(x2 - x1);
    int dy = abs(y2 - y1);
    int sx = (x1 < x2) ? 1 : -1;
    int sy = (y1 < y2) ? 1 : -1;
    int err = dx - dy;
    
    while (true) {
        putpixel(x1, y1, WHITE);
        if (x1 == x2 && y1 == y2) break;
        
        int e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x1 += sx; }
        if (e2 <  dx) { err += dx; y1 += sy; }
    }
}

int main() {
    int gd = DETECT, gm;
    initgraph(&gd, &gm, "");
    
    Bresenham(${x1}, ${y1}, ${x2}, ${y2});
    
    getch();
    closegraph();
    return 0;
}`;
}

// Midpoint Circle
function drawCircle() {
  const canvas = document.getElementById('mcCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = parseInt(document.getElementById('mcX').value);
  const cy = parseInt(document.getElementById('mcY').value);
  const r = parseInt(document.getElementById('mcR').value);
  const color = document.getElementById('mcColor').value;

  ctx.fillStyle = '#050709'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx, canvas.width, canvas.height);
  drawAxes(ctx, canvas.width, canvas.height);

  let x = 0, y = r, d = 1 - r;
  ctx.fillStyle = color;

  function plot8(cx, cy, x, y) {
    [[cx+x,cy+y],[cx-x,cy+y],[cx+x,cy-y],[cx-x,cy-y],
     [cx+y,cy+x],[cx-y,cy+x],[cx+y,cy-x],[cx-y,cy-x]].forEach(([px,py]) => {
      ctx.fillRect(px-1, py-1, 2, 2);
    });
  }

  while (x <= y) {
    plot8(cx, cy, x, y);
    if (d < 0) d += 2*x + 3;
    else { d += 2*(x-y) + 5; y--; }
    x++;
  }

  ctx.strokeStyle = color; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI*2); ctx.stroke();

  const code = generateCircleCode(cx, cy, r);
  document.getElementById('mcCppCode').innerHTML = highlightCpp(code);
}

function generateCircleCode(cx, cy, r) {
  return `// Midpoint Circle Drawing Algorithm
// VirtuLab — Computer Graphics Module
// Center: (${cx},${cy}), Radius: ${r}

#include <graphics.h>
using namespace std;

void plotCirclePoints(int cx, int cy, int x, int y) {
    putpixel(cx+x, cy+y, WHITE);
    putpixel(cx-x, cy+y, WHITE);
    putpixel(cx+x, cy-y, WHITE);
    putpixel(cx-x, cy-y, WHITE);
    putpixel(cx+y, cy+x, WHITE);
    putpixel(cx-y, cy+x, WHITE);
    putpixel(cx+y, cy-x, WHITE);
    putpixel(cx-y, cy-x, WHITE);
}

void MidpointCircle(int cx, int cy, int r) {
    int x = 0, y = r;
    int d = 1 - r;
    
    while (x <= y) {
        plotCirclePoints(cx, cy, x, y);
        if (d < 0) {
            d += 2*x + 3;
        } else {
            d += 2*(x - y) + 5;
            y--;
        }
        x++;
    }
}

int main() {
    int gd = DETECT, gm;
    initgraph(&gd, &gm, "");
    MidpointCircle(${cx}, ${cy}, ${r});
    getch(); closegraph();
    return 0;
}`;
}

// 2D Transforms
let t2dParams = { tx:50, ty:30, angle:45, sx:1.5, sy:1.5, axis:'x', shx:0.5, shy:0 };
let current2DMode = 'translate';
const SHAPE_PTS = [[50,30],[150,30],[150,130],[50,130]]; 

function init2DTransform(mode) {
  current2DMode = mode;
  const ctrl = document.getElementById('t2dControls');
  const configs = {
    translate: `<div class="ctrl-group"><span class="ctrl-label">Tx</span><input type="range" id="t2d_tx" min="-150" max="150" value="50" oninput="update2D()"></div>
                <div class="ctrl-group"><span class="ctrl-label">Ty</span><input type="range" id="t2d_ty" min="-150" max="150" value="30" oninput="update2D()"></div>`,
    rotate:    `<div class="ctrl-group"><span class="ctrl-label">Angle</span><input type="range" id="t2d_angle" min="0" max="360" value="45" oninput="update2D()"></div>`,
    scale:     `<div class="ctrl-group"><span class="ctrl-label">Sx</span><input type="range" id="t2d_sx" min="10" max="300" value="150" oninput="update2D()"></div>
                <div class="ctrl-group"><span class="ctrl-label">Sy</span><input type="range" id="t2d_sy" min="10" max="300" value="150" oninput="update2D()"></div>`,
    reflect:   `<div class="ctrl-group"><span class="ctrl-label">Axis</span><select id="t2d_axis" onchange="update2D()" style="width:auto;padding:0.3rem;"><option value="x">X-axis</option><option value="y">Y-axis</option><option value="o">Origin</option></select></div>`,
    shear:     `<div class="ctrl-group"><span class="ctrl-label">Shx</span><input type="range" id="t2d_shx" min="-200" max="200" value="50" oninput="update2D()"></div>
                <div class="ctrl-group"><span class="ctrl-label">Shy</span><input type="range" id="t2d_shy" min="-200" max="200" value="0" oninput="update2D()"></div>`,
  };
  ctrl.innerHTML = configs[mode] || '';
  setTimeout(() => update2D(), 10);
}

function update2D() {
  const canvas = document.getElementById('t2dCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#050709'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx, canvas.width, canvas.height);
  
  const W = canvas.width, H = canvas.height;
  const originX = W/2, originY = H/2;

  ctx.strokeStyle = '#1e2330'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, originY); ctx.lineTo(W, originY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(originX, 0); ctx.lineTo(originX, H); ctx.stroke();

  const orig = [[-70,-50],[70,-50],[70,50],[-70,50]];
  
  ctx.strokeStyle = 'rgba(100,116,139,0.4)'; ctx.lineWidth = 1.5;
  ctx.setLineDash([4,4]);
  ctx.beginPath();
  orig.forEach((p, i) => {
    const x = originX + p[0], y = originY + p[1];
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);

  let transformed = orig.map(([x, y]) => {
    const mode = current2DMode;
    if (mode === 'translate') {
      const tx = parseFloat(document.getElementById('t2d_tx')?.value || 50);
      const ty = parseFloat(document.getElementById('t2d_ty')?.value || 30);
      return [x + tx, y + ty];
    } else if (mode === 'rotate') {
      const a = (parseFloat(document.getElementById('t2d_angle')?.value || 45)) * Math.PI / 180;
      return [x*Math.cos(a) - y*Math.sin(a), x*Math.sin(a) + y*Math.cos(a)];
    } else if (mode === 'scale') {
      const sx = (parseFloat(document.getElementById('t2d_sx')?.value || 150)) / 100;
      const sy = (parseFloat(document.getElementById('t2d_sy')?.value || 150)) / 100;
      return [x * sx, y * sy];
    } else if (mode === 'reflect') {
      const axis = document.getElementById('t2d_axis')?.value || 'x';
      if (axis === 'x') return [x, -y];
      if (axis === 'y') return [-x, y];
      return [-x, -y];
    } else if (mode === 'shear') {
      const shx = (parseFloat(document.getElementById('t2d_shx')?.value || 50)) / 100;
      const shy = (parseFloat(document.getElementById('t2d_shy')?.value || 0)) / 100;
      return [x + shx*y, y + shy*x];
    }
    return [x, y];
  });

  ctx.strokeStyle = 'var(--accent)'; ctx.lineWidth = 2;
  ctx.beginPath();
  transformed.forEach((p, i) => {
    const x = originX + p[0], y = originY + p[1];
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath(); ctx.stroke();

  ctx.fillStyle = 'rgba(0,229,255,0.06)';
  ctx.fill();

  updateMatrixDisplay(current2DMode);
  generate2DCode(current2DMode);
}

function updateMatrixDisplay(mode) {
  const el = document.getElementById('t2dMatrix');
  const matrices = {
    translate: (tx, ty) => `[1  0  ${tx}]\n[0  1  ${ty}]\n[0  0   1 ]`,
    rotate: (a) => { const r = a*Math.PI/180; return `[${c(Math.cos(r))}  ${c(-Math.sin(r))}  0]\n[${c(Math.sin(r))}  ${c(Math.cos(r))}  0]\n[0       0      1]`; },
    scale: (sx, sy) => `[${sx}  0   0]\n[0   ${sy}  0]\n[0   0   1]`,
  };
  function c(v) { return v.toFixed(2).padStart(5); }
  
  if (mode === 'translate') {
    const tx = document.getElementById('t2d_tx')?.value || 0;
    const ty = document.getElementById('t2d_ty')?.value || 0;
    el.innerHTML = `<div style="white-space:pre;color:var(--accent);">${matrices.translate(tx, ty)}</div>`;
  } else if (mode === 'rotate') {
    const a = document.getElementById('t2d_angle')?.value || 0;
    el.innerHTML = `<div style="white-space:pre;color:var(--accent);">${matrices.rotate(parseFloat(a))}</div><div style="color:var(--muted);font-size:0.75rem;margin-top:0.5rem;">θ = ${a}°</div>`;
  } else {
    el.innerHTML = `<div style="color:var(--muted);font-size:0.85rem;">See generated code →</div>`;
  }
}

function generate2DCode(mode) {
  const codes = {
    translate: () => {
      const tx = document.getElementById('t2d_tx')?.value || 0;
      const ty = document.getElementById('t2d_ty')?.value || 0;
      return `// 2D Translation
// VirtuLab CG Module | Tx=${tx}, Ty=${ty}
#include <GL/glut.h>

void display() {
    glClear(GL_COLOR_BUFFER_BIT);
    
    // Original shape (dashed)
    glColor3f(0.4, 0.4, 0.5);
    glBegin(GL_LINE_LOOP);
        glVertex2f(-70, -50);
        glVertex2f( 70, -50);
        glVertex2f( 70,  50);
        glVertex2f(-70,  50);
    glEnd();
    
    // Translation Matrix: [1 0 Tx; 0 1 Ty; 0 0 1]
    glPushMatrix();
    glTranslatef(${tx}, ${ty}, 0);
    
    glColor3f(0, 0.9, 1);
    glBegin(GL_LINE_LOOP);
        glVertex2f(-70, -50);
        glVertex2f( 70, -50);
        glVertex2f( 70,  50);
        glVertex2f(-70,  50);
    glEnd();
    glPopMatrix();
    
    glFlush();
}

int main(int argc, char** argv) {
    glutInit(&argc, argv);
    glutInitWindowSize(500, 400);
    glutCreateWindow("2D Translation");
    gluOrtho2D(-250, 250, -200, 200);
    glutDisplayFunc(display);
    glutMainLoop();
    return 0;
}`;
    },
    rotate: () => {
      const a = document.getElementById('t2d_angle')?.value || 0;
      return `// 2D Rotation
// VirtuLab CG Module | Angle=${a}°
#include <GL/glut.h>

void display() {
    glClear(GL_COLOR_BUFFER_BIT);
    
    glColor3f(0.4, 0.4, 0.5);
    glBegin(GL_LINE_LOOP);
        glVertex2f(-70, -50); glVertex2f(70, -50);
        glVertex2f(70, 50);   glVertex2f(-70, 50);
    glEnd();
    
    // Rotation Matrix: [cosθ -sinθ; sinθ cosθ]
    glPushMatrix();
    glRotatef(${a}, 0, 0, 1); // Rotate ${a}° around Z-axis
    
    glColor3f(0, 0.9, 1);
    glBegin(GL_LINE_LOOP);
        glVertex2f(-70, -50); glVertex2f(70, -50);
        glVertex2f(70, 50);   glVertex2f(-70, 50);
    glEnd();
    glPopMatrix();
    
    glFlush();
}

int main(int argc, char** argv) {
    glutInit(&argc, argv);
    glutInitWindowSize(500, 400);
    glutCreateWindow("2D Rotation");
    gluOrtho2D(-250, 250, -200, 200);
    glutDisplayFunc(display);
    glutMainLoop();
    return 0;
}`;
    },
  };
  const fn = codes[mode] || codes['translate'];
  document.getElementById('t2dCode').innerHTML = highlightCpp(fn());
}

// 3D Transforms
function draw3D() {
  const canvas = document.getElementById('canvas3d');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const rx = parseFloat(document.getElementById('rx').value) * Math.PI / 180;
  const ry = parseFloat(document.getElementById('ry').value) * Math.PI / 180;
  const scale = parseFloat(document.getElementById('rs').value);
  const proj = document.getElementById('projType').value;

  ctx.fillStyle = '#050709'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx, canvas.width, canvas.height);

  const verts = [
    [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
    [-1,-1, 1],[1,-1, 1],[1,1, 1],[-1,1, 1]
  ];

  const rotX = v => [v[0], v[1]*Math.cos(rx)-v[2]*Math.sin(rx), v[1]*Math.sin(rx)+v[2]*Math.cos(rx)];
  const rotY = v => [v[0]*Math.cos(ry)+v[2]*Math.sin(ry), v[1], -v[0]*Math.sin(ry)+v[2]*Math.cos(ry)];

  const projected = verts.map(v => {
    let p = rotX(v);
    p = rotY(p);
    let px, py;
    if (proj === 'ortho') {
      px = p[0] * scale + canvas.width/2;
      py = -p[1] * scale + canvas.height/2;
    } else {
      const d = 4;
      const z = p[2] + d;
      px = (p[0] / z) * scale * 2 + canvas.width/2;
      py = -(p[1] / z) * scale * 2 + canvas.height/2;
    }
    return [px, py, p[2]];
  });

  const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];

  edges.forEach(([a, b]) => {
    const za = projected[a][2], zb = projected[b][2];
    const alpha = Math.min(1, Math.max(0.3, (za + zb + 2) / 4));
    ctx.strokeStyle = `rgba(0,229,255,${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(projected[a][0], projected[a][1]);
    ctx.lineTo(projected[b][0], projected[b][1]);
    ctx.stroke();
  });

  projected.forEach(([x, y]) => {
    ctx.fillStyle = 'var(--accent)';
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2); ctx.fill();
  });

  const rxD = document.getElementById('rx').value;
  const ryD = document.getElementById('ry').value;
  const sc = document.getElementById('rs').value;
  const code = `// 3D Rotation (OpenGL)
// VirtuLab CG Module | Rx=${rxD}° Ry=${ryD}° Scale=${sc}
#include <GL/glut.h>
#include <cmath>

float rotX = ${rxD}, rotY = ${ryD};

// Rotation matrix X-axis
void rotateX(float v[3], float angle) {
    float r = angle * M_PI / 180.0f;
    float y = v[1]*cos(r) - v[2]*sin(r);
    float z = v[1]*sin(r) + v[2]*cos(r);
    v[1] = y; v[2] = z;
}

// Rotation matrix Y-axis
void rotateY(float v[3], float angle) {
    float r = angle * M_PI / 180.0f;
    float x =  v[0]*cos(r) + v[2]*sin(r);
    float z = -v[0]*sin(r) + v[2]*cos(r);
    v[0] = x; v[2] = z;
}

void display() {
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    glLoadIdentity();
    
    // Apply ${proj === 'persp' ? 'Perspective' : 'Orthographic'} projection
    glRotatef(rotX, 1, 0, 0);
    glRotatef(rotY, 0, 1, 0);
    glScalef(${(sc/80).toFixed(2)}, ${(sc/80).toFixed(2)}, ${(sc/80).toFixed(2)});
    
    glColor3f(0.0f, 0.9f, 1.0f);
    glutWireCube(2.0);
    
    glutSwapBuffers();
}

int main(int argc, char** argv) {
    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_DOUBLE | GLUT_DEPTH);
    glutInitWindowSize(500, 400);
    glutCreateWindow("3D Cube — ${proj}");
    glEnable(GL_DEPTH_TEST);
    ${proj === 'persp' ? 'gluPerspective(45, 1.25, 0.1, 100);\nglTranslatef(0, 0, -5);' : 'gluOrtho2D(-3, 3, -3, 3);'}
    glutDisplayFunc(display);
    glutMainLoop();
    return 0;
}`;
  document.getElementById('code3d').innerHTML = highlightCpp(code);
}

// Cohen-Sutherland Clipping
const LINES = [
  {x1:20,y1:20,x2:390,y2:260},{x1:50,y1:130,x2:380,y2:50},
  {x1:10,y1:260,x2:250,y2:10},{x1:180,y1:10,x2:380,y2:270}
];

function computeCode(x, y, xmin, ymin, xmax, ymax) {
  let c = 0;
  if (x < xmin) c |= 1;
  if (x > xmax) c |= 2;
  if (y < ymin) c |= 4;
  if (y > ymax) c |= 8;
  return c;
}

function cohenSutherland(x1, y1, x2, y2, xmin, ymin, xmax, ymax) {
  let c1 = computeCode(x1,y1,xmin,ymin,xmax,ymax);
  let c2 = computeCode(x2,y2,xmin,ymin,xmax,ymax);
  while (true) {
    if (!(c1|c2)) return {x1,y1,x2,y2,accept:true};
    if (c1&c2) return {accept:false};
    const c = c1 ? c1 : c2;
    let x, y;
    if (c&8) { x = x1+(x2-x1)*(ymax-y1)/(y2-y1); y = ymax; }
    else if (c&4) { x = x1+(x2-x1)*(ymin-y1)/(y2-y1); y = ymin; }
    else if (c&2) { y = y1+(y2-y1)*(xmax-x1)/(x2-x1); x = xmax; }
    else { y = y1+(y2-y1)*(xmin-x1)/(x2-x1); x = xmin; }
    if (c === c1) { x1=x; y1=y; c1=computeCode(x1,y1,xmin,ymin,xmax,ymax); }
    else { x2=x; y2=y; c2=computeCode(x2,y2,xmin,ymin,xmax,ymax); }
  }
}

function drawClipping() {
  const canvas = document.getElementById('clipCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const xmin = parseInt(document.getElementById('cxmin').value);
  const xmax = parseInt(document.getElementById('cxmax').value);
  const ymin = parseInt(document.getElementById('cymin').value);
  const ymax = parseInt(document.getElementById('cymax').value);

  ctx.fillStyle = '#050709'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx, canvas.width, canvas.height);

  ctx.strokeStyle = 'var(--warn)'; ctx.lineWidth = 2; ctx.setLineDash([]);
  ctx.strokeRect(xmin, ymin, xmax-xmin, ymax-ymin);
  ctx.fillStyle = 'rgba(245,158,11,0.05)';
  ctx.fillRect(xmin, ymin, xmax-xmin, ymax-ymin);

  let results = [];
  LINES.forEach(l => {
    ctx.strokeStyle = 'rgba(100,116,139,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
    ctx.setLineDash([]);

    const clipped = cohenSutherland(l.x1, l.y1, l.x2, l.y2, xmin, ymin, xmax, ymax);
    if (clipped.accept) {
      ctx.strokeStyle = 'var(--accent)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(clipped.x1, clipped.y1); ctx.lineTo(clipped.x2, clipped.y2); ctx.stroke();
      results.push('✓ Accepted');
    } else {
      results.push('✗ Rejected');
    }
  });

  document.getElementById('clipResult').textContent = 'Lines: ' + results.join(' | ');

  const code = `// Cohen-Sutherland Line Clipping
// VirtuLab CG Module | Window: (${xmin},${ymin})-(${xmax},${ymax})

#include <graphics.h>
#define LEFT 1
#define RIGHT 2
#define BOTTOM 4
#define TOP 8

int computeCode(float x, float y) {
    int code = 0;
    if (x < ${xmin}) code |= LEFT;
    if (x > ${xmax}) code |= RIGHT;
    if (y < ${ymin}) code |= BOTTOM;
    if (y > ${ymax}) code |= TOP;
    return code;
}

void cohenSutherland(float x1,float y1,float x2,float y2) {
    int c1 = computeCode(x1,y1);
    int c2 = computeCode(x2,y2);
    
    while (true) {
        if (!(c1|c2)) {
            // Completely inside - accept
            line(x1,y1,x2,y2);
            return;
        }
        if (c1&c2) return; // Completely outside
        
        int c = c1 ? c1 : c2;
        float x, y;
        
        if (c & TOP)         { x = x1+(x2-x1)*(${ymax}-y1)/(y2-y1); y=${ymax}; }
        else if (c & BOTTOM) { x = x1+(x2-x1)*(${ymin}-y1)/(y2-y1); y=${ymin}; }
        else if (c & RIGHT)  { y = y1+(y2-y1)*(${xmax}-x1)/(x2-x1); x=${xmax}; }
        else                 { y = y1+(y2-y1)*(${xmin}-x1)/(x2-x1); x=${xmin}; }
        
        if (c == c1) { x1=x; y1=y; c1=computeCode(x1,y1); }
        else         { x2=x; y2=y; c2=computeCode(x2,y2); }
    }
}

int main() {
    int gd=DETECT, gm;
    initgraph(&gd,&gm,"");
    rectangle(${xmin},${ymin},${xmax},${ymax});
    cohenSutherland(20,20,390,260);
    getch(); closegraph(); return 0;
}`;
  document.getElementById('clipCode').innerHTML = highlightCpp(code);
}

// Bezier Curves
let bezierPts = [{x:60,y:240},{x:120,y:60},{x:280,y:60},{x:360,y:240}];
let dragIdx = -1;

function initBezier() {
  const canvas = document.getElementById('bezierCanvas');
  if (!canvas) return;
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); bezierMM({clientX: e.touches[0].clientX, clientY: e.touches[0].clientY}); });
}

function bezierMD(e) {
  const canvas = document.getElementById('bezierCanvas');
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);
  dragIdx = bezierPts.findIndex(p => Math.hypot(p.x - mx, p.y - my) < 16);
}

function bezierMM(e) {
  if (dragIdx < 0) return;
  const canvas = document.getElementById('bezierCanvas');
  const rect = canvas.getBoundingClientRect();
  bezierPts[dragIdx].x = (e.clientX - rect.left) * (canvas.width / rect.width);
  bezierPts[dragIdx].y = (e.clientY - rect.top) * (canvas.height / rect.height);
  drawBezier();
  updateBezierCode();
}

function bezierMU() { dragIdx = -1; }

function drawBezier() {
  const canvas = document.getElementById('bezierCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#050709'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(100,116,139,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
  ctx.beginPath();
  bezierPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke(); ctx.setLineDash([]);

  ctx.strokeStyle = 'var(--accent2)'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(bezierPts[0].x, bezierPts[0].y);
  ctx.bezierCurveTo(
    bezierPts[1].x, bezierPts[1].y,
    bezierPts[2].x, bezierPts[2].y,
    bezierPts[3].x, bezierPts[3].y
  );
  ctx.stroke();

  const ptColors = ['var(--accent3)', 'var(--warn)', 'var(--warn)', 'var(--accent3)'];
  bezierPts.forEach((p, i) => {
    ctx.fillStyle = ptColors[i]; ctx.strokeStyle = '#050709'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0a0c10';
    ctx.font = '9px Space Mono'; ctx.textAlign = 'center';
    ctx.fillText('P'+i, p.x, p.y+3);
  });
}

function updateBezierCode() {
  const p = bezierPts;
  const code = `// Cubic Bezier Curve (OpenGL)
// VirtuLab CG Module
// Control Points:
//   P0=(${Math.round(p[0].x)},${Math.round(p[0].y)})  P1=(${Math.round(p[1].x)},${Math.round(p[1].y)})
//   P2=(${Math.round(p[2].x)},${Math.round(p[2].y)})  P3=(${Math.round(p[3].x)},${Math.round(p[3].y)})

#include <GL/glut.h>
#include <cmath>

// Bernstein basis polynomials
float B0(float t) { return (1-t)*(1-t)*(1-t); }
float B1(float t) { return 3*t*(1-t)*(1-t); }
float B2(float t) { return 3*t*t*(1-t); }
float B3(float t) { return t*t*t; }

// Control points
float px[4] = {${p.map(pt => Math.round(pt.x)).join(', ')}};
float py[4] = {${p.map(pt => Math.round(pt.y)).join(', ')}};

void drawBezier() {
    glColor3f(0.49f, 0.23f, 0.93f); // Purple
    glBegin(GL_LINE_STRIP);
    
    int N = 200; // Number of segments
    for (int i = 0; i <= N; i++) {
        float t = (float)i / N;
        
        // Cubic Bezier formula:
        // B(t) = B0(t)*P0 + B1(t)*P1 + B2(t)*P2 + B3(t)*P3
        float x = B0(t)*px[0] + B1(t)*px[1] + B2(t)*px[2] + B3(t)*px[3];
        float y = B0(t)*py[0] + B1(t)*py[1] + B2(t)*py[2] + B3(t)*py[3];
        
        glVertex2f(x, y);
    }
    glEnd();
}

void display() {
    glClear(GL_COLOR_BUFFER_BIT);
    drawBezier();
    
    // Draw control polygon
    glColor3f(0.3f, 0.3f, 0.3f);
    glEnable(GL_LINE_STIPPLE);
    glLineStipple(2, 0xAAAA);
    glBegin(GL_LINE_STRIP);
    for (int i = 0; i < 4; i++) glVertex2f(px[i], py[i]);
    glEnd();
    glDisable(GL_LINE_STIPPLE);
    
    glFlush();
}

int main(int argc, char** argv) {
    glutInit(&argc, argv);
    glutInitWindowSize(500, 400);
    glutCreateWindow("Bezier Curve");
    gluOrtho2D(0, 420, 300, 0);
    glutDisplayFunc(display);
    glutMainLoop();
    return 0;
}`;
  document.getElementById('bezierCode').innerHTML = highlightCpp(code);
}