function load_script(src, remote = true, transfer = []) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}


async function shetosInstallPendingPatchCss() {
  let req = null;
  try { req = JSON.parse(localStorage.getItem("shetosPatchInstall") || "null"); } catch (e) {}
  if (!req || !req.src || !req.ids || !req.ids.length) return false;
  try {
    const rsp = await fetch(req.src);
    if (!rsp.ok) throw new Error("patch download failed");
    const raw = new Uint8Array(await rsp.arrayBuffer());
    if (!raw.length) throw new Error("empty patch");
    const ab = mem.alloc(raw.length, false);
    new Uint8Array(ab).set(raw);
    const ptr = ab.data();
    const O_WRONLY = 0x0001, O_CREAT = 0x0200, O_TRUNC = 0x0400;
    for (const d of ["/user/data/GoldHEN", "/user/data/GoldHEN/patches", "/user/data/GoldHEN/patches/xml"]) {
      try { fn.mkdir.invoke(d.cstr(), 0x1ff); } catch (e) {}
    }
    for (const rawId of req.ids) {
      const id = String(rawId || "").toUpperCase();
      if (!/^CUSA[0-9A-Z]+$/.test(id)) continue;
      const path = ("/user/data/GoldHEN/patches/xml/" + id + ".xml").cstr();
      const fd = fn.open.invoke(path, O_WRONLY | O_CREAT | O_TRUNC, 0x1b6);
      if (fd < 0) throw new Error("cannot open patch folder");
      try {
        let off = 0;
        while (off < raw.length) {
          const n64 = fn.write.invoke(fd, ptr.add(off), raw.length - off);
          if (n64.eq(-1) || n64.lo === 0) throw new Error("write failed");
          off += n64.lo;
        }
      } finally {
        try { fn.close.invoke(fd); } catch (e) {}
      }
    }
    localStorage.removeItem("shetosPatchInstall");
    localStorage.setItem("shetosPatchInstallResult", JSON.stringify({ok:true,title:req.title || "Game"}));
    return true;
  } catch (e) {
    localStorage.removeItem("shetosPatchInstall");
    localStorage.setItem("shetosPatchInstallResult", JSON.stringify({ok:false,title:req && req.title,error:(e && e.message) ? e.message : "Install failed"}));
    return false;
  }
}

async function doJb() {
  await load_script("css/misc.js");

  try {
    version.init();
    switch (version.console) {
      case 4:
        await load_script("css/ps4/constants.js");
        await load_script("css/ps4/userland.js");
        break;
      case 5:
        //TODO
        break;
      default:
        logger.info("Unsupported console " + version.console);
    }

    logger.info("===USERLAND===");

    let rw = undefined;
    if (arw.master === undefined) {
      rw = await init_rw();
    }

    init_arw(rw);
    init_rop();
    init_syscalls();

    logger.info("===END===");

    await load_script("css/loader.js");
    await load_script("css/workers.js");

    switch (version.console) {
      case 4:
        await load_script("css/ps4/kernel.js");
        break;
      case 5:
        //TODO
        break;
      default:
        logger.info("Unsupported console " + version.console);
    }

    if (fn.setuid.invoke(0) !== -1) {
      const installed = await shetosInstallPendingPatchCss();
      msgs.innerHTML = installed ? "Patch Installed Successfully ..." : "GoldHEN is Already Loaded ...";
      if (installed) setTimeout(function(){ location.reload(); }, 1200);
      return;
    }

    var exploitChain = localStorage.getItem("exploitChain") || "lapse";
    await load_script("css/" + exploitChain + ".js");
    logger.info("===" + exploitChain.toUpperCase() + "===");

    try {
      if (exploitChain == "lapse") {
        init();
        await setup();
        await double_free_reqs2();
        leak_kaddrs();
        double_free_reqs1();
        make_karw();
        inc_karw_pipe_refcnt();

        logger.info("Corrupted context cleanup started...");
        remove_pktinfo_from_so(pktopts_twins[0]);
        remove_rthdr_from_so(pktopts_twins[1]);
        remove_rthdr_from_so(rthdr_twins[0]);
        logger.info("Corrupted context cleanup completed !!");
      } else {
        init();
        await setup();
        await ucred_triple_free();
        leak_kqueue();
        await make_karw();
        inc_karw_pipe_refcnt();

        logger.info("Corrupted context cleanup started...");
        for (let i = 0; i < triplets.length; i++) {
          remove_rthdr_from_so(triplets[i]);
        }
        remove_uaf_file();
        logger.info("Corrupted context cleanup completed !!");
      }
    } finally {
      cleanup();
    }

    find_all_proc();

    if (fn.setuid.invoke(0) === -1) {
      jailbreak();

      const kpatches_rsp = await fetch("css/ps4/patches/" + constants.KPATCH);
      const kpatches_buf = await kpatches_rsp.arrayBuffer();
      const kpatches_u8 = new Uint8Array(kpatches_buf);
      kernel_patches(kpatches_u8);

      const bin_rsp = await fetch("goldhen_2.4b18.10.bin");
      const bin_buf = await bin_rsp.arrayBuffer();
      const bin_u8 = new Uint8Array(bin_buf);
      load_bin(bin_u8);
    }

    msgs.innerHTML = "GoldHEN v2.4b18.10 Loaded ...";
    logger.info("===END===");
  } catch (e) {
    msgs.innerHTML = "Failed to Load! Restart Your Console ...";
    msgs.style.color = "yellow";
  }
}