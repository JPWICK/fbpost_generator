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
  if (!apiKey) { alert("Please enter your API key!"); return; }

  btn.disabled = true;
  btn.textContent = '🎨 Designing...';
  setStatus('Gemini 3.1 is thinking...');

  try {
    // 1. GET TEXT FROM GEMINI 3.1 FLASH LITE
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
    
    // We ask Gemini to be a Graphic Designer and write the prompt for us
    const promptText = `Generate a Buddhist post concept. 
    1. QUOTE: A short Buddhist quote in Sinhala. 
    2. IMAGE: A detailed English description of a serene scene (misty forest, stone lanterns, or lotus). 
    3. COLOR: A Hex color matching the scene.
    Format exactly: QUOTE: [text] IMAGE: [text] COLOR: [hex]`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });

    const data = await response.json();
    const raw = data.candidates[0].content.parts[0].text;

    // Parse the data
    const quote = raw.split("QUOTE:")[1].split("IMAGE:")[0].trim();
    const imgDesc = raw.split("IMAGE:")[1].split("COLOR:")[0].trim();
    const hex = raw.split("COLOR:")[1].trim();

    // Update UI text
    document.getElementById('n_main').value = quote;
    document.getElementById('n_titlecol').value = hex;
    document.getElementById('n_titlecol_h').value = hex;
    switchMode('nodate');

    // 2. FETCH IMAGE FROM POLLINATIONS (Optimized)
    setStatus('Painting background...');
    
    // We add a random seed and 'flux' model for high quality
    const seed = Math.floor(Math.random() * 999999);
    const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(imgDesc + ", cinematic lighting, high resolution, serene") }?width=1080&height=1080&seed=${seed}&model=flux&nologo=true`;

    const img = new Image();
    img.crossOrigin = "anonymous"; // CRITICAL: Must be lowercase

    // This handles the "Stuck" issue
    const imageLoad = new Promise((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image server busy. Try again."));
      setTimeout(() => reject(new Error("Request timed out.")), 20000); // 20 sec timeout
    });

    img.src = imageUrl;
    
    const loadedImg = await imageLoad;
    bgImage = loadedImg;
    renderCanvas();

    btn.disabled = false;
    btn.textContent = '✨ Auto-Generate Post';
    setStatus('✅ Done!');

  } catch (error) {
    console.error("Error details:", error);
    setStatus('❌ ' + error.message);
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

// This function creates an image WITHOUT using Gemini tokens
async function testOnlyImage() {
  const btn = document.getElementById('testImgBtn');
  const apiKey = document.getElementById('ai_apikey').value.trim();
  
  if (!apiKey) {
    alert("Please enter your Gemini API Key first!");
    return;
  }

  btn.disabled = true;
  btn.textContent = '🎨 Gemini is painting...';
  setStatus('Using Gemini 2.5 Flash TTS (Multimodal)...');

  try {
    // 1. Correct URL for the 2.5 Flash TTS model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-tts:generateContent?key=${apiKey}`;

    const promptText = "Generate a high-end, professional photography background for a Buddhist post. Subject: A serene stone stupa in a misty mountain forest at sunrise. Soft golden light, cinematic bokeh, sharp focus. Leave the left side empty for text.";

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          // 2. This is the multimodal command to get an IMAGE back
          responseModalities: ["IMAGE"] 
        }
      })
    });

    const data = await response.json();

    // 3. Extract the Image data (Gemini returns it as a Base64 string)
    const imagePart = data.candidates[0].content.parts.find(p => p.inlineData);
    if (!imagePart) throw new Error("No image data returned from Gemini.");
    
    const imageBase64 = imagePart.inlineData.data;

    // 4. Draw the Gemini image to your Canvas
    const img = new Image();
    img.onload = () => {
      bgImage = img;
      renderCanvas();
      btn.disabled = false;
      btn.textContent = '🖼️ Try Background Generator';
      setStatus('✅ Real Gemini Image Loaded!');
    };
    
    // We tell the browser this is a PNG image made from Gemini's text data
    img.src = `data:image/png;base64,${imageBase64}`;

  } catch (error) {
    console.error(error);
    setStatus('❌ Gemini Error: ' + error.message);
    btn.disabled = false;
    btn.textContent = '🖼️ Try Background Generator';
  }
}




renderCanvas();
