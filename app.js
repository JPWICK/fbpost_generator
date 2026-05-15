const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let bgImage = null;
let currentMode = 'date';
let fontsReady = false;

// ── Load fonts via FontFace API ──
async function loadFonts() {
  try {
    const fonts = [
      new FontFace('NotoSinhala', 'url(https://fonts.gstatic.com/s/notoserifsinhala/v20/DtV9JesiZDLBhF_rBB2JMYF6E_4IAMGJGRsT.woff2)', {weight:'400'}),
      new FontFace('NotoSinhala', 'url(https://fonts.gstatic.com/s/notoserifsinhala/v20/DtV9JesiZDLBhF_rBB2JMYF6E_4IAMGJGRsT.woff2)', {weight:'700'}),
      new FontFace('NotoSinhala', 'url(https://fonts.gstatic.com/s/notoserifsinhala/v20/DtV9JesiZDLBhF_rBB2JMYF6E_4IAMGJGRsT.woff2)', {weight:'900'}),
    ];
    await Promise.all(fonts.map(f => f.load().then(loaded => document.fonts.add(loaded)).catch(()=>{})));
  } catch(e) {}
  fontsReady = true;
  renderCanvas();
}
loadFonts();

function getFont(weight, size) {
  return `${weight} ${size}px 'NotoSinhala', 'Noto Serif Sinhala', 'Noto Sans Sinhala', serif`;
}

function switchMode(m) {
  currentMode = m;
  document.getElementById('tab-date').classList.toggle('active', m==='date');
  document.getElementById('tab-nodate').classList.toggle('active', m==='nodate');
  document.getElementById('panel-date').classList.toggle('active', m==='date');
  document.getElementById('panel-nodate').classList.toggle('active', m==='nodate');
  renderCanvas();
}

// ── SYNC INPUTS ──
function syncColor(pid, hid) {
  const p=document.getElementById(pid), h=document.getElementById(hid);
  if(!p || !h) return;
  p.addEventListener('input',()=>{h.value=p.value;renderCanvas();});
  h.addEventListener('input',()=>{p.value=h.value;renderCanvas();});
}
['d_numcol','d_badgecol','d_daycol','d_textcol','n_titlecol','n_maincol','n_subcol','n_tagcol']
  .forEach(id=>syncColor(id,id+'_h'));

function syncRange(id,vid){
  const el = document.getElementById(id);
  if(!el) return;
  el.addEventListener('input',function(){
    document.getElementById(vid).textContent=this.value+'%'; renderCanvas();
  });
}
syncRange('d_scale','d_scale_v'); syncRange('d_top','d_top_v');
syncRange('n_scale','n_scale_v'); syncRange('n_vpos','n_vpos_v');

document.querySelectorAll('input[type="text"],textarea,select').forEach(el=>{
  el.addEventListener('input',()=>renderCanvas());
});

// ── RENDERING ──
function drawBg(){
  if(bgImage){
    const a=bgImage.width/bgImage.height;
    let sx=0,sy=0,sw=bgImage.width,sh=bgImage.height;
    if(a>1){sw=bgImage.height;sx=(bgImage.width-sw)/2;}
    else{sh=bgImage.width;sy=(bgImage.height-sh)/2;}
    ctx.drawImage(bgImage,sx,sy,sw,sh,0,0,1080,1080);
  } else {
    ctx.fillStyle='#1a0800';ctx.fillRect(0,0,1080,1080);
  }
}

function wrapText(text,maxW){
  const out=[];
  for(const line of text.split('\n')){
    const words=line.split(' ');let cur='';
    for(const w of words){
      const t=cur?cur+' '+w:w;
      if(ctx.measureText(t).width>maxW&&cur){out.push(cur);cur=w;}else cur=t;
    }
    if(cur)out.push(cur);
  }
  return out;
}

function rrect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

function drawBox(lines,cx,y,w,lh,style,textColor){
  const pad=40, bh=lines.length*lh+pad*2, bx=cx-w/2, by=y-pad;
  ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 20;
  if(style==='gold') ctx.fillStyle='rgba(255,250,225,0.88)';
  else if(style==='dark') ctx.fillStyle='rgba(15,8,0,0.85)';
  else if(style==='green') ctx.fillStyle='rgba(12,45,22,0.90)';
  else return y+lines.length*lh;
  rrect(bx,by,w,bh,22); ctx.fill();
  ctx.shadowBlur = 0; ctx.strokeStyle='rgba(201,162,39,0.5)'; ctx.lineWidth=1.5;
  rrect(bx,by,w,bh,22); ctx.stroke();
  ctx.textAlign='center'; ctx.fillStyle=textColor;
  let ty=y; for(const l of lines){ctx.fillText(l,cx,ty); ty+=lh;}
  return by+bh+20;
}

function renderCanvas(){
  ctx.clearRect(0,0,1080,1080);
  drawBg();
  if(currentMode==='date') renderDateMode();
  else renderNodateMode();
}

function renderNodateMode(){
  const sc=parseInt(document.getElementById('n_scale').value)/100;
  const vp=parseInt(document.getElementById('n_vpos').value)/100;
  const cx=540; let y=1080*vp;
  const boxStyle=document.getElementById('n_boxstyle').value;
  const titleCol=document.getElementById('n_titlecol_h').value;
  const mainCol=document.getElementById('n_maincol_h').value;
  const title=document.getElementById('n_title').value.trim();
  if(title){
    ctx.font=getFont(900,Math.round(72*sc)); ctx.fillStyle=titleCol;
    for(const l of wrapText(title,920*sc)){ctx.fillText(l,cx,y); y+=Math.round(82*sc);}
  }
  const main=document.getElementById('n_main').value.trim();
  if(main){
    ctx.font=getFont(700,Math.round(58*sc)); const lh=Math.round(72*sc);
    const lines=wrapText(main,820*sc);
    if(boxStyle!=='none') y=drawBox(lines,cx,y+lh,860,lh,boxStyle,mainCol);
    else{ctx.fillStyle=mainCol; for(const l of lines){ctx.fillText(l,cx,y); y+=lh;}}
  }
  const tag=document.getElementById('n_tag').value.trim();
  if(tag){
    ctx.font=getFont(600,Math.round(40*sc)); ctx.fillStyle=document.getElementById('n_tagcol_h').value;
    ctx.fillText(tag,cx,1000);
  }
}

// ── FAIL-PROOF AI AUTOMATION ──
async function generateAiPost() {
  const apiKey = document.getElementById('ai_apikey').value.trim();
  const btn = document.getElementById('aiBtn');
  if (!apiKey) { alert("Enter Gemini API Key"); return; }

  btn.disabled = true;
  btn.textContent = '🎨 Designing...';
  setStatus('Gemini 3.1 Flash Lite is thinking...');

  try {
    // Exact model string from your AI Studio screenshot
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

    const promptText = `Generate a high-quality Buddhist post. 
    1. QUOTE: A powerful short Buddhist quote in Sinhala.
    2. IMAGE_PROMPT: English description of a serene scene (misty pagoda, oil lamp, or lotus). Use 'golden lighting' and 'bokeh background'.
    3. COLOR: One matching Hex color for the title.
    FORMAT: 
    QUOTE: [text]
    IMAGE_PROMPT: [text]
    COLOR: [hex]`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });

    const data = await response.json();
    if (!data.candidates) throw new Error("API Limit reached or invalid key.");
    
    const raw = data.candidates[0].content.parts[0].text;
    
    // Safer Parsing
    const quote = raw.split("QUOTE:")[1].split("IMAGE_PROMPT:")[0].trim();
    const imgDesc = raw.split("IMAGE_PROMPT:")[1].split("COLOR:")[0].trim();
    const hex = raw.split("COLOR:")[1].trim();

    document.getElementById('n_main').value = quote;
    document.getElementById('n_titlecol').value = hex;
    document.getElementById('n_titlecol_h').value = hex;

    setStatus('Fetching AI Image...');
    switchMode('nodate');

    // Pollinations with FLUX model
    const seed = Math.floor(Math.random() * 999999);
    const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(imgDesc)}?width=1080&height=1080&seed=${seed}&model=flux&nologo=true`;

    const img = new Image();
    img.crossOrigin = "anonymous"; 
    img.onload = () => {
      bgImage = img;
      renderCanvas();
      btn.disabled = false;
      btn.textContent = '✨ Auto-Generate Post';
      setStatus('✅ Completed!');
    };
    img.onerror = () => { throw new Error("Image failed to load"); };
    img.src = imageUrl;

  } catch (error) {
    console.error(error);
    setStatus('❌ Error: ' + error.message);
    btn.disabled = false;
    btn.textContent = '✨ Auto-Generate Post';
  }
}

function setStatus(m){ document.getElementById('status').textContent = m; }

function downloadPost(){
  canvas.toBlob((blob)=>{
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download='buddha-post.png'; a.click();
  },'image/png');
}

renderCanvas();
