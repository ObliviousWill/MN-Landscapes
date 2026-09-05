/* ── Mobile menu ─────────────────────────────────────────────────────
   Full-screen panel. Closed, it is visibility:hidden, so it is out of the
   tab order and the accessibility tree. Open, focus moves into it, Tab is
   trapped between the close button and the last link, Escape closes, and
   focus returns to the button. */
(function(){
  var btn=document.getElementById('menubtn'),nav=document.getElementById('nav');
  if(!btn||!nav) return;
  var MQ=window.matchMedia('(max-width:1150px)');

  function items(){
    return [btn].concat(Array.prototype.slice.call(nav.querySelectorAll('a')));
  }
  function isOpen(){ return nav.dataset.open==='true'; }

  /* Belt and braces: the hidden attribute carries the UA's own display:none,
     so the closed panel stays unrendered even if the stylesheet is stale or
     fails to load. Above the breakpoint the nav is an ordinary inline list
     and must never carry it. */
  function syncHidden(){ nav.hidden = MQ.matches ? !isOpen() : false; }

  function set(open){
    nav.dataset.open=open?'true':'false';
    if(open) nav.hidden=false;
    btn.setAttribute('aria-expanded',open?'true':'false');
    btn.textContent=open?'Close':'Menu';
    btn.setAttribute('aria-label',open?'Close menu':'Open menu');
    document.documentElement.style.overflow=open?'hidden':'';
    document.body.style.overflow=open?'hidden':'';
    if(open){
      /* the header sits above the panel and its height changes with scroll,
         so clear it by measurement rather than a guessed padding */
      var hdr=document.querySelector('header');
      if(hdr) nav.style.paddingTop=Math.round(hdr.getBoundingClientRect().bottom+28)+'px';
      var first=nav.querySelector('a');
      if(first) first.focus();
    }else{
      if(nav.contains(document.activeElement)) btn.focus();
      syncHidden();
    }
  }

  btn.addEventListener('click',function(){ set(!isOpen()); });

  /* a link closes the panel; the browser handles the jump or the navigation */
  nav.addEventListener('click',function(e){
    if(e.target.closest('a')) set(false);
  });

  document.addEventListener('keydown',function(e){
    if(!isOpen()) return;
    if(e.key==='Escape'){ e.preventDefault(); set(false); return; }
    if(e.key!=='Tab') return;
    var list=items(), i=list.indexOf(document.activeElement);
    if(i===-1) return;
    var next=e.shiftKey ? (i===0?list.length-1:i-1) : (i===list.length-1?0:i+1);
    e.preventDefault();
    list[next].focus();
  });

  /* resizing past the breakpoint must not leave the page scroll-locked */
  var onChange=function(){ if(!MQ.matches && isOpen()) set(false); syncHidden(); };
  if(MQ.addEventListener) MQ.addEventListener('change',onChange);
  else if(MQ.addListener) MQ.addListener(onChange);
  syncHidden();
})();

/* ── Before / after ──────────────────────────────────────────────────── */
(function(){
  var before=document.getElementById('ba-before'),after=document.getElementById('ba-after');
  if(!before||!after) return;
  document.querySelectorAll('[data-ba]').forEach(function(b){
    b.addEventListener('click',function(){
      var showBefore=b.dataset.ba==='before';
      before.hidden=!showBefore; after.hidden=showBefore;
      document.querySelectorAll('[data-ba]').forEach(function(o){
        o.setAttribute('aria-pressed',String(o===b));
      });
    });
  });
})();

/* ── Lead form ───────────────────────────────────────────────────────── */
(function(){
  var form=document.getElementById('leadform'),
      side=document.getElementById('formside'),
      thanks=document.getElementById('thanks'),
      recap=document.getElementById('recap'),
      head=document.getElementById('thanks-h');
  if(!form) return;
  function mark(id,bad){document.getElementById(id).dataset.invalid=bad?'true':'false';}
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var elName=document.getElementById('q-name'),
        elPhone=document.getElementById('q-phone'),
        elPc=document.getElementById('q-postcode'),
        name=elName.value.trim(),
        phone=elPhone.value.trim(),
        pc=elPc.value.trim(),
        bad=false,first=null;
    if(!name){mark('f-name',true);bad=true;first=first||elName;}else mark('f-name',false);
    if(phone.replace(/[^0-9]/g,'').length<9){mark('f-phone',true);bad=true;first=first||elPhone;}
      else mark('f-phone',false);
    if(pc.length<4){mark('f-postcode',true);bad=true;first=first||elPc;}
      else mark('f-postcode',false);
    if(bad){first.focus();return;}
    var wants=Array.prototype.map.call(form.querySelectorAll('input[name=want]:checked'),
          function(i){return i.value});
    var stage=form.querySelector('input[name=stage]:checked');
    head.textContent='Thank you, '+name.split(' ')[0]+' — that’s with us.';
    recap.innerHTML=
      '<div><i>Name</i>'+esc(name)+'</div>'+
      '<div><i>Phone</i>'+esc(phone)+'</div>'+
      '<div><i>Postcode</i>'+esc(pc.toUpperCase())+'</div>'+
      '<div><i>Interested in</i>'+esc(wants.length?wants.join(', '):'To be discussed')+'</div>'+
      '<div><i>Stage</i>'+esc(stage?stage.value:'Not given')+'</div>';
    side.hidden=true; thanks.hidden=false;
    thanks.scrollIntoView({block:'center',behavior:'smooth'});
  });
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  document.getElementById('again').addEventListener('click',function(){
    form.reset(); thanks.hidden=true; side.hidden=false;
    ['f-name','f-phone','f-postcode'].forEach(function(i){mark(i,false)});
    document.getElementById('q-name').focus();
  });
})();

/* ── CAD garden plan (canvas) ────────────────────────────────────────── */
(function(){
  var c=document.getElementById('plan'); if(!c||!c.getContext) return;
  var W=1000,H=560,dpr=Math.min(window.devicePixelRatio||1,2);
  c.width=W*dpr; c.height=H*dpr;
  c.style.aspectRatio=W+'/'+H;
  var g=c.getContext('2d'); g.scale(dpr,dpr);
  var INK='#2c4032', LINE='rgba(44,64,50,.55)', FAINT='rgba(44,64,50,.20)',
      OCHRE='#d18c22', MOSS='#5c8455';
  g.fillStyle='#fbfaf7'; g.fillRect(0,0,W,H);

  /* faint 20mm survey grid */
  g.strokeStyle='rgba(44,64,50,.045)'; g.lineWidth=1;
  for(var x=0;x<=W;x+=20){g.beginPath();g.moveTo(x+.5,0);g.lineTo(x+.5,H);g.stroke();}
  for(var y=0;y<=H;y+=20){g.beginPath();g.moveTo(0,y+.5);g.lineTo(W,y+.5);g.stroke();}

  var L=70,T=54,R=930,B=486;                       /* plot boundary */
  g.strokeStyle=INK; g.lineWidth=2.2;
  g.setLineDash([9,5]); g.strokeRect(L,T,R-L,B-T); g.setLineDash([]);

  /* house */
  g.fillStyle='rgba(44,64,50,.07)';
  g.fillRect(L,B-96,232,96);
  g.strokeStyle=INK; g.lineWidth=2.8; g.strokeRect(L,B-96,232,96);
  g.strokeStyle=LINE; g.lineWidth=1;
  for(var i=0;i<14;i++){g.beginPath();g.moveTo(L+i*18,B);g.lineTo(L+i*18+18,B-96);g.stroke();}
  g.fillStyle=INK; g.font='600 21px "Source Sans 3",sans-serif';
  g.fillText('HOUSE',L+16,B-96+26);
  g.strokeStyle=OCHRE; g.lineWidth=4;
  g.beginPath(); g.moveTo(L+186,B-96); g.lineTo(L+228,B-96); g.stroke();
  g.fillStyle=INK; g.font='400 18px "Source Sans 3",sans-serif';
  g.fillText('FRENCH DOORS',L+118,B-106);

  /* terrace: porcelain planks */
  var tx=L+232,ty=B-180,tw=300,th=180;
  g.fillStyle='rgba(44,64,50,.04)'; g.fillRect(tx,ty,tw,th);
  g.strokeStyle=INK; g.lineWidth=2.8; g.strokeRect(tx,ty,tw,th);
  g.strokeStyle=FAINT; g.lineWidth=1;
  for(var p=1;p<7;p++){g.beginPath();g.moveTo(tx,ty+p*(th/7));g.lineTo(tx+tw,ty+p*(th/7));g.stroke();}
  for(var q=1;q<4;q++){g.beginPath();g.moveTo(tx+q*(tw/4),ty);g.lineTo(tx+q*(tw/4),ty+th);g.stroke();}
  g.fillStyle=INK; g.font='600 21px "Source Sans 3",sans-serif';
  g.fillText('TERRACE',tx+14,ty+26);
  g.font='400 18px "Source Sans 3",sans-serif'; g.fillStyle='rgba(44,64,50,.7)';
  g.fillText('porcelain plank, sawn edge',tx+14,ty+44);

  /* stepping path across lawn */
  g.strokeStyle=INK; g.lineWidth=2.2;
  for(var s=0;s<6;s++){
    var sx=tx+tw+26+s*46, sy=ty+96-s*11;
    g.strokeRect(sx,sy,34,22);
  }

  /* lawn */
  g.strokeStyle=MOSS; g.lineWidth=2.2; g.setLineDash([4,4]);
  g.beginPath(); g.moveTo(tx+tw+8,ty-6);
  g.bezierCurveTo(700,10+ty,860,ty+40,880,ty+150);
  g.lineTo(tx+tw+8,ty+th-6); g.closePath(); g.stroke(); g.setLineDash([]);
  g.fillStyle=MOSS; g.font='600 21px "Source Sans 3",sans-serif';
  g.fillText('LAWN',tx+tw+150,ty+150);

  /* planting beds + plant symbols */
  function bed(x0,y0,x1,y1){
    g.strokeStyle=MOSS; g.lineWidth=2.0;
    g.beginPath(); g.moveTo(x0,y0);
    g.bezierCurveTo(x0+(x1-x0)*.35,y0-26,x0+(x1-x0)*.65,y0+26,x1,y1);
    g.stroke();
  }
  bed(L+8,T+150,tx+tw+40,T+92);
  bed(L+8,T+40,R-14,T+22);
  var seeds=[[130,120,17],[186,142,12],[250,112,20],[318,146,13],[386,118,16],
             [452,146,11],[520,112,18],[596,140,13],[664,116,15],[740,142,11],
             [812,118,17],[876,146,12]];
  seeds.forEach(function(s,i){
    g.strokeStyle=(i%3===0)?INK:MOSS; g.lineWidth=1.7;
    g.beginPath(); g.arc(s[0],s[1],s[2],0,Math.PI*2); g.stroke();
    if(i%3===0){
      for(var a=0;a<8;a++){
        var an=a*Math.PI/4;
        g.beginPath();
        g.moveTo(s[0]+Math.cos(an)*s[2]*.35,s[1]+Math.sin(an)*s[2]*.35);
        g.lineTo(s[0]+Math.cos(an)*s[2],s[1]+Math.sin(an)*s[2]);
        g.stroke();
      }
    }
  });
  g.fillStyle=MOSS; g.font='600 20px "Source Sans 3",sans-serif';
  g.fillText('MIXED BORDER',L+8,T+205);

  /* specimen tree */
  g.strokeStyle=INK; g.lineWidth=2.2;
  g.beginPath(); g.arc(690,300,58,0,Math.PI*2); g.stroke();
  g.setLineDash([3,4]);
  g.beginPath(); g.arc(690,300,40,0,Math.PI*2); g.stroke(); g.setLineDash([]);
  g.beginPath(); g.moveTo(682,292); g.lineTo(698,308);
  g.moveTo(698,292); g.lineTo(682,308); g.stroke();
  g.fillStyle=INK; g.font='400 18px "Source Sans 3",sans-serif';
  g.fillText('AMELANCHIER',652,378);

  /* water feature */
  g.strokeStyle=OCHRE; g.lineWidth=2.8;
  g.strokeRect(tx+40,ty-64,120,44);
  g.strokeStyle='rgba(209,140,34,.55)'; g.lineWidth=1;
  for(var w=0;w<4;w++){
    g.beginPath(); g.moveTo(tx+48,ty-56+w*10); g.lineTo(tx+152,ty-56+w*10); g.stroke();
  }
  g.fillStyle='#a06a12'; g.font='600 18px "Source Sans 3",sans-serif';
  g.fillText('STILL WATER',tx+44,ty-72);

  /* dimension line */
  function dim(x0,x1,y,label){
    g.strokeStyle=INK; g.lineWidth=1;
    g.beginPath(); g.moveTo(x0,y); g.lineTo(x1,y);
    g.moveTo(x0,y-6); g.lineTo(x0,y+6);
    g.moveTo(x1,y-6); g.lineTo(x1,y+6); g.stroke();
    g.fillStyle='#fbfaf7';
    var tw2=g.measureText(label).width+14;
    g.fillRect((x0+x1)/2-tw2/2,y-13,tw2,26);
    g.fillStyle=INK; g.font='600 20px "Source Sans 3",sans-serif';
    g.textAlign='center'; g.fillText(label,(x0+x1)/2,y+6); g.textAlign='left';
  }
  g.font='600 20px "Source Sans 3",sans-serif';
  dim(L,R,T-26,'26.4 m');
  dim(tx,tx+tw,ty+th+18,'8.2 m');

  /* north arrow */
  g.strokeStyle=INK; g.lineWidth=2.0;
  g.beginPath(); g.arc(884,86,22,0,Math.PI*2); g.stroke();
  g.beginPath(); g.moveTo(884,68); g.lineTo(878,98); g.lineTo(884,92);
  g.lineTo(890,98); g.closePath(); g.fillStyle=INK; g.fill();
  g.font='600 18px "Source Sans 3",sans-serif'; g.textAlign='center';
  g.fillText('N',884,60); g.textAlign='left';

  /* title block */
  g.strokeStyle=INK; g.lineWidth=2.0;
  g.strokeRect(R-380,H-42,380,30);
  g.fillStyle=INK; g.font='600 18px "Source Sans 3",sans-serif';
  g.font='600 17px "Source Sans 3",sans-serif';
  g.fillText('MN LANDSCAPES  ·  PLAN 04  ·  REV B  ·  1:100',R-368,H-21);
})();
