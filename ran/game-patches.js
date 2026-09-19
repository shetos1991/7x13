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
        '.gpIds{font-size:.83rem;color:#9fd2ff;margin-top:4px;word-break:break-word}',
        '.gpMeta{font-size:.8rem;color:#aaa;margin-top:4px}',
        '#gpDetail{display:none;height:calc(100% - 66px);overflow-y:auto}',
        '#gpDetail h2{color:#ffd700;margin:8px 0 5px;font-size:1.5rem}',
        '#gpDetailIds{color:#9fd2ff;font-size:.93rem;margin-bottom:12px;word-break:break-word}',
        '.gpPatch{padding:10px 11px;margin:7px 0;border-left:3px solid #ffd700;background:#151b27;border-radius:5px}',
        '.gpPatchName{font-weight:800;color:#fff}',
        '.gpPatchInfo{font-size:.82rem;color:#aaa;margin-top:4px;line-height:1.35}',
        '.gpActions{position:sticky;bottom:0;background:rgba(12,16,25,.98);padding:11px 0 3px;display:flex;gap:8px}',
        '.gpAction{display:inline-block;text-decoration:none;border:1px solid #ffd700;border-radius:8px;padding:9px 12px;color:#ffd700;background:#181818;font-weight:800;cursor:pointer}',
        '.gpHint{font-size:.82rem;color:#c9c9c9;margin:10px 0 4px;line-height:1.4}',
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
          '<input id="gpSearch" type="text" autocomplete="off" placeholder="Search game or CUSA...">' +
          '<div id="gpCount"></div>' +
          '<div id="gpList"></div>' +
        '</div>' +
        '<div id="gpDetail">' +
          '<h2 id="gpDetailTitle"></h2>' +
          '<div id="gpDetailIds"></div>' +
          '<div id="gpPatchList"></div>' +
          '<div class="gpHint">GoldHEN patch path: /user/data/GoldHEN/patches/xml/</div>' +
          '<div class="gpActions"><button class="gpAction" id="gpBack" type="button">BACK</button><a class="gpAction" id="gpOpenXml" href="#" target="_blank">OPEN XML</a></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    var data = window.SHETOS_PATCHES;
    var list = document.getElementById('gpList');
    var count = document.getElementById('gpCount');
    var search = document.getElementById('gpSearch');
    var browse = document.getElementById('gpBrowse');
    var detail = document.getElementById('gpDetail');

    function esc(s){
      s = String(s || '');
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }
    function showList(q){
      q = String(q || '').toUpperCase();
      var html = '', shown = 0;
      for (var i=0;i<data.length;i++) {
        var g=data[i];
        var hay=(g.title+' '+g.ids.join(' ')+' '+g.file).toUpperCase();
        if (q && hay.indexOf(q) === -1) continue;
        html += '<div class="gpGame" tabindex="0" data-i="'+i+'"><div class="gpGameName">'+esc(g.title)+'</div><div class="gpIds">'+esc(g.ids.join(' • '))+'</div><div class="gpMeta">'+g.patches.length+' patch'+(g.patches.length===1?'':'es')+' • '+esc(g.file)+'</div></div>';
        shown++;
      }
      list.innerHTML=html || '<div style="padding:20px;color:#bbb">No matching game found.</div>';
      count.innerHTML=shown+' games shown • 154 XML files • 504 patches';
      var nodes=list.getElementsByClassName('gpGame');
      for(var j=0;j<nodes.length;j++){
        nodes[j].onclick=function(){openGame(parseInt(this.getAttribute('data-i'),10));};
        nodes[j].onkeydown=function(e){e=e||window.event;if(e.keyCode===13||e.keyCode===32){openGame(parseInt(this.getAttribute('data-i'),10));return false;}};
      }
    }
    function openGame(i){
      var g=data[i], html='';
      document.getElementById('gpDetailTitle').innerHTML=esc(g.title);
      document.getElementById('gpDetailIds').innerHTML=esc(g.ids.join(' • '));
      for(var p=0;p<g.patches.length;p++){
        var x=g.patches[p];
        html += '<div class="gpPatch"><div class="gpPatchName">'+esc(x.name || 'Patch')+'</div><div class="gpPatchInfo">App '+esc(x.appVer || '-')+' • Patch '+esc(x.patchVer || '-')+(x.author?' • '+esc(x.author):'')+(x.note?'<br>'+esc(x.note):'')+'</div></div>';
      }
      document.getElementById('gpPatchList').innerHTML=html;
      document.getElementById('gpOpenXml').href='patches/xml/'+encodeURIComponent(g.file);
      browse.style.display='none'; detail.style.display='block';
      detail.scrollTop=0;
    }
    function back(){ detail.style.display='none'; browse.style.display='block'; search.focus(); }
    function close(){ overlay.style.display='none'; }
    button.onclick=function(){overlay.style.display='block';back();showList(search.value);};
    document.getElementById('gpClose').onclick=close;
    document.getElementById('gpBack').onclick=back;
    search.onkeyup=function(){showList(this.value);};
    overlay.onclick=function(e){e=e||window.event;if(e.target===overlay)close();};
    showList('');
})();
