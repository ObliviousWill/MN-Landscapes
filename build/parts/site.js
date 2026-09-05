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
      /* the header sits above the panel and the call bar below it, and both
         change height with scroll and viewport, so clear them by measurement
         rather than by guessed padding */
      var hdr=document.querySelector('header');
      if(hdr) nav.style.paddingTop=Math.round(hdr.getBoundingClientRect().bottom+20)+'px';
      var bar=document.getElementById('actionbar');
      var barH=(bar&&getComputedStyle(bar).display!=='none')
        ? bar.getBoundingClientRect().height : 0;
      nav.style.paddingBottom=Math.round(barH+24)+'px';
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
