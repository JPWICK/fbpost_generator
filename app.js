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

// Template Data
const dateTemplates={
  morning:{d_line1:'අද',d_line2:'මැයි මස',d_num:'15',d_suf:'වෙනි',d_dayname:'සිකුරාදා',
    d_main:'ඔබේ අදහස් පිරිසිදු කරගන්න,\nවචන පිරිසිදු කරගන්න,\nක්‍රියා පිරිසිදු කරගන්න,\nඑවිට ජීවිතය ලස්සන වෙනු ඇත !',
    d_quote:'',d_badgecol:'#1a5c3a',d_numcol:'#8B0000'},
  quote:{d_line1:'අද',d_line2:'මැයි මස',d_num:'15',d_suf:'වෙනි',d_dayname:'බදාදා',
    d_main:'ඔබ තනි වු විට\nබුදුන්\nඔබ සමග සිටිය !',
    d_quote:'මම බුදුන් සරණ යම්,\nධම් සරණ යම්,\nසඟුන් සරණ යම්.',
    d_badgecol:'#3d1a00',d_numcol:'#8B0000'},
  evening:{d_line1:'අද',d_line2:'මැයි මස',d_num:'15',d_suf:'වෙනි',d_dayname:'සිකුරාදා',
    d_main:'හොඳ සිතුවිලි\nහොඳ වැඩ\nහොඳ දවසක්\nඔබට ලැබේවා!',
    d_quote:'',d_badgecol:'#4a3000',d_numcol:'#c07000'},
  night:{d_line1:'අද',d_line2:'මැයි මස',d_num:'15',d_suf:'වෙනි',d_dayname:'සිකුරාදා',
    d_main:'අවුල් වූ ජීවිතය,\nඅද සිට ලිහන්න\nපටන්ගමු!',
    d_quote:'හිත නිවැරදි නම්,\nජීවිතයත් නිවැරදි වේ.',
    d_badgecol:'#1a1a4a',d_numcol:'#4444cc'}
};
function loadDateTemplate(n){
  const t=dateTemplates[n];
  Object.entries(t).forEach(([k,v])=>{
    const el=document.getElementById(k);if(el)el.value=v;
    const h=document.getElementById(k+'_h');if(h)h.value=v;
  }); renderCanvas();
}

const nodateTemplates={
  dhamma:{n_title:'බුදු වදන',n_main:'හිත නිවැරදි නම්,\nජීවිතයත් නිවැරදි වේ.',n_sub:'— ධම්මපදය —',n_tag:'🪷 සුභ දවසක් වේවා! 🪷',n_boxstyle:'gold',n_titlecol:'#8B0000',n_maincol:'#1a0f00',n_subcol:'#5a3800',n_tagcol:'#8b0000'},
  blessing:{n_title:'සුභ පැතුම',n_main:'ඔබට හා ඔබේ\nකුටුම්භයට\nබුදු සරණ ලැබේවා!',n_sub:'',n_tag:'🙏 ත්‍රිරත්න සරණයි 🙏',n_boxstyle:'green',n_titlecol:'#1a5c3a',n_maincol:'#f0fff0',n_subcol:'#a0c0a0',n_tagcol:'#1a5c3a'},
  poya:{n_title:'පොහොය දිනයයි',n_main:'සීල ගෙන\nභාවනා කර\nදාන දී\nපිනක් රැස් කරගනිමු.',n_sub:'— ශ්‍රේෂ්ඨ පොහොය දිනය —',n_tag:'🌕 සුභ පොහොය! 🌕',n_boxstyle:'gold',n_titlecol:'#8B0000',n_maincol:'#1a0f00',n_subcol:'#5a3800',n_tagcol:'#8b0000'},
  goodnight:{n_title:'සුභ රාත්‍රීයක් වේවා!',n_main:'ඔබේ සිත සාමකාමී වේවා,\nඔබේ නින්ද පහසු වේවා,\nඔබේ හෙට දිනය සුන්දර වේවා.',n_sub:'',n_tag:'🌙 නිදාගන්න 🌙',n_boxstyle:'dark',n_titlecol:'#aaaaff',n_maincol:'#f0e8d0',n_subcol:'#a090c0',n_tagcol:'#8888ff'},
  motivation:{n_title:'ධෛර්ය ගනිමු!',n_main:'ඉදිරියට යාමට\nධෛර්යය ගනිමු.\nමේ මොහොත\nඅමතක නොකරමු.',n_sub:'— ජාතක කතා —',n_tag:'🪷 ජය වේවා! 🪷',n_boxstyle:'gold',n_titlecol:'#8B0000',n_maincol:'#1a0f00',n_subcol:'#5a3800',n_tagcol:'#8b0000'},
  triple:{n_title:'',n_main:'බුදුන් සරණ යම්.\nධම් සරණ යම්.\nසඟුන් සරණ යම්.',n_sub:'',n_tag:'🙏 ත්‍රිරත්න සරණයි 🙏',n_boxstyle:'gold',n_titlecol:'#8B0000',n_maincol:'#1a0f00',n_subcol:'#5a3800',n_tagcol:'#8b0000'}
};
function loadNodateTemplate(n){
  const t=nodateTemplates[n];
  Object.entries(t).forEach(([k,v])=>{
    const el=document.getElementById(k);if(el)el.value=v;
    const h=document.getElementById(k+'_h');if(h)h.value=v;
  }); renderCanvas();
}

function setStatus(msg){ document.getElementById('status').textContent=msg; }

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
  const pad=30,bh=lines.length*lh+pad*2,bx=cx-w/2,by=y-pad;
  if(style==='gold') ctx.fillStyle='rgba(255,245,210,0.93)';
  else if(style==='dark') ctx.fillStyle='rgba(14,7,0,0.85)';
  else if(style==='green') ctx.fillStyle='rgba(16,50,24,0.90)';
  else return y+lines.length*lh;
  rrect(bx,by,w,bh,14);ctx.fill();
  ctx.strokeStyle='#c9a227';ctx.lineWidth=2;rrect(bx,by,w,bh,14);ctx.stroke();
  ctx.font=`bold ${Math.round(lh*1.1)}px Georgia,serif`;
  ctx.fillStyle='rgba(139,105,20,0.55)';
  ctx.textAlign='left';ctx.fillText('\u201C',bx+15,by+lh);
  ctx.textAlign='right';ctx.fillText('\u201D',bx+w-15,by+bh-8);
  ctx.textAlign='center';ctx.fillStyle=textColor;
  let ty=y;for(const l of lines){ctx.fillText(l,cx,ty);ty+=lh;}
  return by+bh+16;
}

function renderCanvas(){
  ctx.clearRect(0,0,1080,1080);
  ctx.textAlign='center';
  ctx.shadowBlur=0;
  drawBg();
  if(currentMode==='date') renderDateMode();
  else renderNodateMode();
  setStatus('');
}

function renderDateMode(){
  const sc=parseInt(document.getElementById('d_scale').value)/100;
  const tp=parseInt(document.getElementById('d_top').value)/100;
  const cx=540; let y=1080*tp+55;
  const numCol=document.getElementById('d_numcol_h').value;
  const badgeCol=document.getElementById('d_badgecol_h').value;
  const dayCol=document.getElementById('d_daycol_h').value;
  const textCol=document.getElementById('d_textcol_h').value;

  ctx.font=`${Math.round(32*sc)}px serif`;ctx.fillStyle='#c9a227';
  ctx.fillText('☸',cx,y);y+=Math.round(38*sc);
  ctx.strokeStyle='#c9a227';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(cx-110,y);ctx.lineTo(cx+110,y);ctx.stroke();
  y+=Math.round(16*sc);

  for(const id of['d_line1','d_line2']){
    const v=document.getElementById(id).value.trim();if(!v)continue;
    ctx.font=getFont(700,Math.round(50*sc));
    ctx.fillStyle='#1a0800';ctx.shadowColor='rgba(180,130,0,0.15)';ctx.shadowBlur=5;
    ctx.fillText(v,cx,y);ctx.shadowBlur=0;y+=Math.round(54*sc);
  }

  const num=document.getElementById('d_num').value.trim();
  const suf=document.getElementById('d_suf').value.trim();
  if(num){
    ctx.font=getFont(900,Math.round(124*sc));
    const nw=ctx.measureText(num).width;
    ctx.font=getFont(700,Math.round(50*sc));
    const sw2=ctx.measureText(' '+suf).width;
    const sx=cx-(nw+sw2)/2;
    ctx.font=getFont(900,Math.round(124*sc));
    ctx.fillStyle=numCol;ctx.textAlign='left';
    ctx.shadowColor='rgba(0,0,0,0.2)';ctx.shadowBlur=7;
    ctx.fillText(num,sx,y+Math.round(84*sc));
    ctx.font=getFont(700,Math.round(50*sc));
    ctx.fillText(' '+suf,sx+nw+3,y+Math.round(84*sc));
    ctx.shadowBlur=0;ctx.textAlign='center';
    y+=Math.round(110*sc);
  }

  const dn=document.getElementById('d_dayname').value.trim();
  if(dn){
    ctx.font=getFont(700,Math.round(54*sc));
    const tw=ctx.measureText(dn).width;
    const bw=tw+Math.round(76*sc),bh=Math.round(66*sc),bx=cx-bw/2;
    ctx.fillStyle=badgeCol;rrect(bx,y,bw,bh,10);ctx.fill();
    ctx.strokeStyle='#c9a227';ctx.lineWidth=2;rrect(bx,y,bw,bh,10);ctx.stroke();
    ctx.font=getFont(700,Math.round(54*sc));
    ctx.fillStyle=dayCol;ctx.fillText(dn,cx,y+bh/2+Math.round(17*sc));
    y+=bh+Math.round(14*sc);
  }

  ctx.font=`${Math.round(24*sc)}px serif`;ctx.fillStyle='#c9a227';
  ctx.fillText('- * -',cx,y+Math.round(18*sc));y+=Math.round(38*sc);

  const main=document.getElementById('d_main').value.trim();
  if(main){
    ctx.font=getFont(600,Math.round(40*sc));ctx.fillStyle=textCol;
    for(const l of wrapText(main,800*sc)){ctx.fillText(l,cx,y);y+=Math.round(54*sc);}
  }

  const qt=document.getElementById('d_quote').value.trim();
  if(qt){
    y+=Math.round(14*sc);
    ctx.font=getFont(500,Math.round(35*sc));
    drawBox(wrapText(qt,670*sc),cx,y+Math.round(34*sc),710,Math.round(48*sc),'gold','#1a0800');
  }
}

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
    ctx.shadowColor='rgba(0,0,0,0.25)';ctx.shadowBlur=8;
    for(const l of wrapText(title,900*sc)){ctx.fillText(l,cx,y);y+=Math.round(78*sc);}
    ctx.shadowBlur=0;
    if(showLotus){
      ctx.strokeStyle='#c9a227';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(cx-150,y+5);ctx.lineTo(cx+150,y+5);ctx.stroke();
      y+=Math.round(24*sc);
    } else y+=Math.round(10*sc);
  } else {
    if(showLotus){ctx.font=`${Math.round(34*sc)}px serif`;ctx.fillStyle='#c9a227';ctx.fillText('☸',cx,y);y+=Math.round(42*sc);}
  }

  const main=document.getElementById('n_main').value.trim();
  if(main){
    ctx.font=getFont(700,Math.round(56*sc));
    const lh=Math.round(68*sc);
    const lines=wrapText(main,780*sc);
    if(boxStyle!=='none') y=drawBox(lines,cx,y+lh,820,lh,boxStyle,mainCol);
    else{ctx.fillStyle=mainCol;for(const l of lines){ctx.fillText(l,cx,y);y+=lh;}y+=Math.round(14*sc);}
  }

  const sub=document.getElementById('n_sub').value.trim();
  if(sub){
    if(showLotus){ctx.font=`${Math.round(20*sc)}px serif`;ctx.fillStyle='#c9a227';ctx.fillText('*',cx,y+Math.round(9*sc));y+=Math.round(28*sc);}
    ctx.font=`italic ${getFont(500,Math.round(34*sc))}`;ctx.fillStyle=subCol;
    for(const l of wrapText(sub,680*sc)){ctx.fillText(l,cx,y);y+=Math.round(44*sc);}
  }

  const tag=document.getElementById('n_tag').value.trim();
  if(tag){
    const tagY=Math.max(y+Math.round(38*sc),1080*0.86);
    if(showLotus){ctx.strokeStyle='rgba(201,162,39,0.4)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx-190,tagY-20);ctx.lineTo(cx+190,tagY-20);ctx.stroke();}
    ctx.font=getFont(600,Math.round(38*sc));ctx.fillStyle=tagCol;ctx.fillText(tag,cx,tagY);
  }
}

// ── AI AUTOMATION (Gemini Integration) ──
async function generateAiPost() {
  const apiKey = document.getElementById('ai_apikey').value.trim();
  const btn = document.getElementById('aiBtn');
  
  if (!apiKey) {
    alert("Please enter your Gemini API key first!");
    return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ Gemini is thinking...';
  setStatus('Step 1: Writing text with Gemini...');

  try {
    // 1. Ask Gemini 1.5 Flash for Text and an Image Prompt
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const textRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Write a short, beautiful Buddhist quote in Sinhala (max 4 lines). Also provide a short 2-word title, a subtext (e.g., source or blessing), and a short visual prompt in English describing a peaceful nature background (no text in image). Output ONLY in valid JSON format: {"title": "", "quote": "", "subtext": "", "imagePrompt": ""}'
          }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!textRes.ok) throw new Error("API Key invalid or rejected by Google Gemini.");
    
    const textData = await textRes.json();
    
    const contentString = textData.candidates[0].content.parts[0].text;
    const content = JSON.parse(contentString);

    // 2. Update the UI with Gemini's Text
    switchMode('nodate');
    document.getElementById('n_title').value = content.title;
    document.getElementById('n_main').value = content.quote;
    document.getElementById('n_sub').value = content.subtext;

    setStatus('Step 2: Generating AI Image...');

    // 3. Generate the Image using a free, keyless AI image service based on Gemini's prompt
    const encodedPrompt = encodeURIComponent(content.imagePrompt + ", peaceful, spiritual, cinematic lighting, no text");
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1080&height=1080&nologo=true`;

    setStatus('Step 3: Downloading to Canvas...');
    
    // 4. Load everything onto your Canvas
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Required to allow canvas download
    img.onload = () => {
      bgImage = img;
      renderCanvas();
      btn.disabled = false;
      btn.textContent = '✨ Auto-Generate Post';
      setStatus('✅ AI Post Generated Successfully!');
      setTimeout(() => setStatus(''), 4000);
    };
    img.onerror = () => {
      throw new Error("Failed to load background image.");
    };
    
    img.src = imageUrl;

  } catch (error) {
    console.error(error);
    alert("Error: " + error.message);
    btn.disabled = false;
    btn.textContent = '✨ Auto-Generate Post';
    setStatus('❌ Error occurred.');
  }
}

// ── DOWNLOAD ──
function downloadPost(){
  const btn=document.getElementById('dlBtn');
  btn.disabled=true;
  btn.textContent='⏳ Preparing...';
  setStatus('Generating image...');

  renderCanvas();

  setTimeout(()=>{
    try {
      canvas.toBlob(function(blob){
        if(!blob){
          setStatus('❌ Could not create image. Try refreshing.');
          btn.disabled=false; btn.textContent='⬇️ Download PNG';
          return;
        }
        const url=URL.createObjectURL(blob);
        const a=document.createElement('a');
        a.href=url;
        a.download='buddhist-post-'+Date.now()+'.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(()=>URL.revokeObjectURL(url),3000);
        setStatus('✅ Downloaded!');
        setTimeout(()=>setStatus(''),3000);
        btn.disabled=false; btn.textContent='⬇️ Download PNG';
      },'image/png');
    } catch(err){
      setStatus('Opening in new tab — right-click to save.');
      const w=window.open();
      if(w) w.document.write('<img src="'+canvas.toDataURL('image/png')+'" style="max-width:100%">');
      btn.disabled=false; btn.textContent='⬇️ Download PNG';
    }
  }, 100);
}

renderCanvas();
