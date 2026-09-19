(function () {
    if (!window.SHETOS_PATCHES || document.getElementById('gpButton')) return;

    var css = document.createElement('style');
    css.textContent = [
        '#gpButton{margin:16px auto 4px;display:block;width:100%;max-width:285px;padding:12px 10px;border:1px solid rgba(255,215,0,.75);border-radius:10px;background:rgba(0,0,0,.58);color:#ffd700;font-size:1.06rem;font-weight:800;letter-spacing:.7px;cursor:pointer;text-shadow:0 0 9px rgba(255,215,0,.3);box-shadow:0 0 14px rgba(0,0,0,.32)}',
        '#gpOverlay{display:none;position:fixed;z-index:999999;left:0;top:0;width:100%;height:100%;background:rgba(0,0,0,.90);font-family:Arial,sans-serif;color:#fff;text-align:left}',
        '#gpPanel{position:absolute;left:4%;top:4%;width:92%;height:92%;box-sizing:border-box;border:1px solid rgba(255,215,0,.75);border-radius:14px;background:rgba(12,16,25,.98);padding:18px;overflow:hidden;box-shadow:0 0 30px rgba(0,0,0,.65)}',
        '#gpTop{height:48px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.13);margin-bottom:13px}',
        '#gpTitle{font-size:1.45rem;font-weight:900;color:#ffd700;letter-spacing:.8px}',
        '#gpClose{border:1px solid #888;background:#222;color:#fff;border-radius:8px;padding:8px 13px;font-weight:700;cursor:pointer}',
        '#gpSearch{width:100%;box-sizing:border-box;padding:12px 13px;border-radius:9px;border:1px solid #555;background:#111722;color:#fff;font-size:1rem;outline:none}',
        '#gpCount{font-size:.88rem;color:#bbb;margin:8px 2px 10px}',
        '#gpList{height:calc(100% - 130px);overflow-y:auto;padding-right:6px}',
        '.gpGame{border:1px solid rgba(255,255,255,.12);background:#151b27;border-radius:9px;padding:11px 12px;margin:7px 0;cursor:pointer}',
        '.gpGame:focus,.gpGame:hover{border-color:#ffd700;background:#1c2433}',
        '.gpGameName{font-size:1rem;font-weight:800;color:#fff}',
        '.gpMeta{font-size:.8rem;color:#aaa;margin-top:4px}',
        '#gpDetail{display:none;height:calc(100% - 66px);overflow-y:auto}',
        '#gpDetail h2{color:#ffd700;margin:8px 0 10px;font-size:1.5rem}',
        '.gpPatch{padding:10px 11px;margin:7px 0;border-left:3px solid #ffd700;background:#151b27;border-radius:5px}',
        '.gpPatchName{font-weight:800;color:#fff}',
        '.gpPatchInfo{font-size:.82rem;color:#aaa;margin-top:4px;line-height:1.35}',
        '.gpActions{position:sticky;bottom:0;background:rgba(12,16,25,.98);padding:12px 0 3px;display:flex;gap:8px}',
        '.gpAction{display:inline-block;border:1px solid #777;border-radius:8px;padding:10px 14px;color:#fff;background:#202020;font-weight:800;cursor:pointer}',
        '#gpInstall{border-color:#42d66b;background:#147a32;color:#fff;flex:1;font-size:1rem}',
        '#gpInstall:disabled{opacity:.55;cursor:default}',
        '#gpToast{display:none;position:fixed;z-index:1000000;left:50%;top:18px;transform:translateX(-50%);max-width:86%;padding:12px 18px;border-radius:9px;background:#102017;border:1px solid #42d66b;color:#fff;font-family:Arial,sans-serif;font-weight:800;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.55)}',
        '@media(max-width:700px){#gpPanel{left:2%;top:2%;width:96%;height:96%;padding:13px}#gpTitle{font-size:1.2rem}.gpGameName{font-size:.95rem}}'
    ].join('');
    document.head.appendChild(css);

    var anchor = document.querySelector('.status-bar');
    if (!anchor) return;
    var button = document.createElement('button');
    button.id = 'gpButton';
    button.type = 'button';
    button.innerHTML = 'GAME PATCHES <span style="font-size:.82em;color:#fff">(154)</span>';
    if (anchor.parentNode) anchor.parentNode.insertBefore(button, anchor.nextSibling);

    var overlay = document.createElement('div');
    overlay.id = 'gpOverlay';
    overlay.innerHTML = '' +
      '<div id="gpPanel">' +
        '<div id="gpTop"><div id="gpTitle">GAME PATCHES</div><button id="gpClose" type="button">CLOSE</button></div>' +
        '<div id="gpBrowse">' +
          '<input id="gpSearch" type="text" autocomplete="off" placeholder="Search game...">' +
          '<div id="gpCount"></div>' +
          '<div id="gpList"></div>' +
        '</div>' +
        '<div id="gpDetail">' +
          '<h2 id="gpDetailTitle"></h2>' +
          '<div id="gpPatchList"></div>' +
          '<div class="gpActions"><button class="gpAction" id="gpBack" type="button">BACK</button><button class="gpAction" id="gpInstall" type="button">INSTALL PATCH</button></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    var toast = document.createElement('div'); toast.id='gpToast'; document.body.appendChild(toast);

    var data = window.SHETOS_PATCHES;
    var list = document.getElementById('gpList');
    var count = document.getElementById('gpCount');
    var search = document.getElementById('gpSearch');
    var browse = document.getElementById('gpBrowse');
    var detail = document.getElementById('gpDetail');
    var currentIndex = -1;

    function esc(s){
      s = String(s || '');
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }
    function showToast(msg, bad){
      toast.textContent=msg; toast.style.borderColor=bad?'#ff5a5a':'#42d66b'; toast.style.background=bad?'#2a1010':'#102017'; toast.style.display='block';
      setTimeout(function(){toast.style.display='none';},6500);
    }
    function showList(q){
      q = String(q || '').toUpperCase();
      var html = '', shown = 0;
      for (var i=0;i<data.length;i++) {
        var g=data[i];
        var hay=(g.title+' '+g.ids.join(' ')).toUpperCase();
        if (q && hay.indexOf(q) === -1) continue;
        html += '<div class="gpGame" tabindex="0" data-i="'+i+'"><div class="gpGameName">'+esc(g.title)+'</div><div class="gpMeta">'+g.patches.length+' patch'+(g.patches.length===1?'':'es')+'</div></div>';
        shown++;
      }
      list.innerHTML=html || '<div style="padding:20px;color:#bbb">No matching game found.</div>';
      count.innerHTML=shown+' games shown';
      var nodes=list.getElementsByClassName('gpGame');
      for(var j=0;j<nodes.length;j++){
        nodes[j].onclick=function(){openGame(parseInt(this.getAttribute('data-i'),10));};
        nodes[j].onkeydown=function(e){e=e||window.event;if(e.keyCode===13||e.keyCode===32){openGame(parseInt(this.getAttribute('data-i'),10));return false;}};
      }
    }
    function openGame(i){
      currentIndex=i;
      var g=data[i], html='';
      document.getElementById('gpDetailTitle').innerHTML=esc(g.title);
      for(var p=0;p<g.patches.length;p++){
        var x=g.patches[p];
        html += '<div class="gpPatch"><div class="gpPatchName">'+esc(x.name || 'Patch')+'</div><div class="gpPatchInfo">Game version '+esc(x.appVer || '-')+(x.note?'<br>'+esc(x.note):'')+'</div></div>';
      }
      document.getElementById('gpPatchList').innerHTML=html;
      browse.style.display='none'; detail.style.display='block'; detail.scrollTop=0;
    }
    function back(){ detail.style.display='none'; browse.style.display='block'; currentIndex=-1; search.focus(); }
    function close(){ overlay.style.display='none'; }
    function install(){
      if(currentIndex<0) return;
      var g=data[currentIndex];
      try {
        localStorage.setItem('shetosPatchInstall', JSON.stringify({src:'patches/xml/'+g.file, ids:g.ids, title:g.title, ts:Date.now()}));
        localStorage.removeItem('shetosPatchInstallResult');
        var b=document.getElementById('gpInstall'); b.disabled=true; b.textContent='PREPARING INSTALL...';
        setTimeout(function(){ location.reload(); },300);
      } catch(e) { showToast('Could not start patch installation.', true); }
    }

    button.onclick=function(){overlay.style.display='block';back();showList(search.value);};
    document.getElementById('gpClose').onclick=close;
    document.getElementById('gpBack').onclick=back;
    document.getElementById('gpInstall').onclick=install;
    search.onkeyup=function(){showList(this.value);};
    overlay.onclick=function(e){e=e||window.event;if(e.target===overlay)close();};
    showList('');

    try {
      var result=JSON.parse(localStorage.getItem('shetosPatchInstallResult')||'null');
      if(result){
        localStorage.removeItem('shetosPatchInstallResult');
        setTimeout(function(){showToast(result.ok ? ('PATCH INSTALLED: '+(result.title||'Game')) : ('INSTALL FAILED: '+(result.error||'Unknown error')), !result.ok);},800);
      }
    } catch(e){}
})();
