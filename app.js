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

function syncColor(pid, hid) {
  const p=document.getElementById(pid), h=document.getElementById(hid);
  p.addEventListener('input',()=>{h.value=p.value;renderCanvas();});
  h.addEventListener('input',()=>{p.value=h.value;renderCanvas();});
}
['d_numcol','d_badgecol','d_daycol','d_textcol','n_titlecol','n_maincol','n_subcol','n_tagcol']
  .forEach(id=>syncColor(id,id+'_h'));

function syncRange(id,vid){
  document.getElementById(id).addEventListener('input',function(){
    document.getElementById(vid).textContent=this.value+'%'; renderCanvas();
  });
}
syncRange('d_scale','d_scale_v'); syncRange('d_top','d_top_v');
syncRange('n_scale','n_scale_v'); syncRange('n_vpos','n_vpos_v');

document.querySelectorAll('input[type="text"],textarea,select').forEach(el=>{
  el.addEventListener('input',()=>renderCanvas());
});

// Upload Handlers
document.getElementById('bgUpload').addEventListener('change',function(e){
  const file=e.target.files[0]; if(!file) return;
  document.getElementById('uploadText').textContent='✅ '+file.name;
  const url=URL.createObjectURL(file);
  const img=new Image();
  img.onload=()=>{ bgImage=img; renderCanvas(); };
  img.onerror=()=>{ setStatus('❌ Image failed to load'); };
  img.src=url;
});

// Rendering Functions
function drawBg(){
  if(bgImage){
    const a=bgImage.width/bgImage.height;
    let sx=0,sy=0,sw=bgImage.width,sh=bgImage.height;
    if(a>1){sw=bgImage.height;sx=(bgImage.width-sw)/2;}
    else{sh=bgImage.width;sy=(bgImage.height-sh)/2;}
    ctx.drawImage(bgImage,sx,sy,sw,sh,0,0,1080,1080);
  } else {
    const g=ctx.createRadialGradient(540,380,0,540,380,700);
    g.addColorStop(0,'#c8860a');g.addColorStop(1,'#1a0800');
    ctx.fillStyle=g;ctx.fillRect(0,0,1080,1080);
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
  
  // High-end glassmorphism effect
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 20;

  if(style==='gold') ctx.fillStyle='rgba(255,250,230,0.85)';
  else if(style==='dark') ctx.fillStyle='rgba(10,5,0,0.80)';
  else if(style==='green') ctx.fillStyle='rgba(10,40,20,0.85)';
  else return y+lines.length*lh;
  
  rrect(bx,by,w,bh,20);
  ctx.fill();
  
  ctx.shadowBlur = 0; // Reset shadow
  ctx.strokeStyle='rgba(201,162,39,0.5)';
  ctx.lineWidth=1;
  rrect(bx,by,w,bh,20);
  ctx.stroke();

  ctx.font=`bold ${Math.round(lh*1.2)}px Georgia,serif`;
  ctx.fillStyle='rgba(139,105,20,0.4)';
  ctx.textAlign='left';ctx.fillText('\u201C',bx+20,by+lh);
  ctx.textAlign='right';ctx.fillText('\u201D',bx+w-20,by+bh-10);
  
  ctx.textAlign='center';ctx.fillStyle=textColor;
  let ty=y;for(const l of lines){ctx.fillText(l,cx,ty);ty+=lh;}
  return by+bh+20;
}

function renderCanvas(){
  ctx.clearRect(0,0,1080,1080);
  ctx.textAlign='center';
  drawBg();
  if(currentMode==='date') renderDateMode();
  else renderNodateMode();
  setStatus('');
}

// ... [Keep your renderDateMode as is] ...

function renderNodateMode(){
  const sc=parseInt(document.getElementById('n_scale').value)/100;
  const vp=parseInt(document.getElementById('n_vpos').value)/100;
  const cx=540; let y=1080*vp;
  const boxStyle=document.getElementById('n_boxstyle').value;
  const showLotus=document.getElementById('n_lotusshow').value==='yes';
  const titleCol=document.getElementById('n_titlecol_h').value;
  const mainCol=document.getElementById('n_maincol_h').value;
  const subCol=document.getElementById('n_subcol_h').value;
  const tagCol=document.getElementById('n_tagcol_h').value;

  const title=document.getElementById('n_title').value.trim();
  if(title){
    if(showLotus){ctx.font=`${Math.round(30*sc)}px serif`;ctx.fillStyle='#c9a227';ctx.fillText('☸',cx,y);y+=Math.round(36*sc);}
    ctx.font=getFont(900,Math.round(70*sc));ctx.fillStyle=titleCol;
    ctx.shadowColor='rgba(0,0,0,0.3)';ctx.shadowBlur=10;
    for(const l of wrapText(title,900*sc)){ctx.fillText(l,cx,y);y+=Math.round(78*sc);}
    ctx.shadowBlur=0;
  }

  const main=document.getElementById('n_main').value.trim();
  if(main){
    ctx.font=getFont(700,Math.round(56*sc));
    const lh=Math.round(68*sc);
    const lines=wrapText(main,800*sc);
    if(boxStyle!=='none') y=drawBox(lines,cx,y+lh,840,lh,boxStyle,mainCol);
    else{ctx.fillStyle=mainCol;for(const l of lines){ctx.fillText(l,cx,y);y+=lh;}y+=Math.round(14*sc);}
  }

  const tag=document.getElementById('n_tag').value.trim();
  if(tag){
    const tagY=Math.max(y+Math.round(40*sc),1080*0.88);
    ctx.font=getFont(600,Math.round(40*sc));ctx.fillStyle=tagCol;ctx.fillText(tag,cx,tagY);
  }
}

// ── NEW IMPROVED AI AUTOMATION ──
async function generateAiPost() {
  const apiKey = document.getElementById('ai_apikey').value.trim();
  const btn = document.getElementById('aiBtn');
  
  if (!apiKey) { alert("Please enter your API key!"); return; }

  btn.disabled = true;
  btn.textContent = '🎨 Designing...';
  setStatus('Gemini is creating a unique concept...');

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

    const promptText = `Generate a high-end Buddhist Facebook post concept.
    1. QUOTE: A powerful, short Buddhist quote in Sinhala.
    2. SUBJECT: Choose ONE diverse scene: (A misty Stupa, a Zen rock garden, lotus flowers on a pond, an ornate temple door, or a single burning oil lamp). VARIETY IS KEY.
    3. IMAGE_PROMPT: A detailed English description for an AI image generator. Style: Photorealistic, cinematic lighting, 8k, bokeh background.
    4. COLOR: A Hex color code for the title that matches the scene.
    Format exactly like this:
    QUOTE: [text]
    IMAGE_PROMPT: [text]
    COLOR: [hex]`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });

    const data = await response.json();
    const raw = data.candidates[0].content.parts[0].text;

    // Parsing the new format
    const quoteText = raw.split("QUOTE:")[1].split("IMAGE_PROMPT:")[0].trim();
    const imgPrompt = raw.split("IMAGE_PROMPT:")[1].split("COLOR:")[0].trim();
    const themeColor = raw.split("COLOR:")[1].trim();

    // Update UI Elements
    switchMode('nodate');
    document.getElementById('n_main').value = quoteText;
    document.getElementById('n_titlecol').value = themeColor;
    document.getElementById('n_titlecol_h').value = themeColor;

    setStatus('Generating High-Quality Background...');

    // Call Pollinations with Flux model for that high-end look
    const finalPrompt = encodeURIComponent(imgPrompt + ", cinematic lighting, serene atmosphere, high resolution, soft focus background");
    const seed = Math.floor(Math.random() * 999999);
    const imageUrl = `https://pollinations.ai/p/${finalPrompt}?width=1080&height=1080&seed=${seed}&model=flux&nologo=true`;

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      bgImage = img;
      renderCanvas();
      btn.disabled = false;
      btn.textContent = '✨ Auto-Generate Post';
      setStatus('✅ Success!');
    };
    img.src = imageUrl;

  } catch (error) {
    console.error(error);
    btn.disabled = false;
    btn.textContent = '✨ Auto-Generate Post';
    setStatus('❌ Error occurred.');
  }
}

// ── DOWNLOAD ──
function downloadPost(){
  const btn=document.getElementById('dlBtn');
  btn.disabled=true;
  btn.textContent='⏳ Saving...';
  renderCanvas();

  setTimeout(()=>{
    canvas.toBlob((blob)=>{
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;
      a.download='buddhist-post-'+Date.now()+'.png';
      a.click();
      btn.disabled=false; btn.textContent='⬇️ Download PNG';
      setStatus('✅ Downloaded!');
    },'image/png');
  }, 200);
}

renderCanvas();
