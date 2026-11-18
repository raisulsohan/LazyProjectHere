// AEHere.jsx - runs inside After Effects, started by AEHere.ps1.
// AEHere.ps1 first sets the global AEHERE = { folder, project, base, result,
// duration, fps, bg, close } and then evaluates this file.
//
// Makes a new project (File > New > New Project, so a New Project Template
// set in Preferences is used), adds three comps "<base>_16X9" 1920x1080,
// "<base>_9X16" 1080x1920 and "<base>_4X5" 1080x1350, saves the project as
// AEHERE.project and opens the 16X9 comp.
//   No template: folders 00 Comps (the comps), 01 Footage, 02 Audio,
//                03 Graphics, 04 Music, 05 Photos.
//   Template:    its folders stay. The comps go into the folder that holds
//                the template's comp (else a "...Comps"/"...Projects" folder,
//                else a new "00 Comps"). Empty template comps are removed:
//                the three new comps take their place.
(function (J) {
    function writeText(path, text) {
        var f = new File(path);
        f.encoding = 'UTF-8';
        f.open('w');
        f.write(text);
        f.close();
    }

    // AEHere.ps1 may send the script again while After Effects is still
    // starting: run it only once.
    var mark = new File(J.result + '.started');
    if (mark.exists) { return; }
    writeText(mark.fsName, 'started');

    try {
        var target = new File(J.project);
        if (target.exists) { throw new Error('The file already exists: ' + target.fsName); }

        // If the open project has unsaved changes, After Effects asks to save
        // it first; Cancel gives null.
        var p = app.newProject();
        if (!p) { writeText(J.result, 'CANCELLED'); return; }

        var i, it, compFolder = null;
        var tplComps = [];
        for (i = 1; i <= p.numItems; i++) {
            if (p.item(i) instanceof CompItem) { tplComps.push(p.item(i)); }
        }

        if (p.numItems === 0) {
            var names = ['00 Comps', '01 Footage', '02 Audio', '03 Graphics', '04 Music', '05 Photos'];
            for (i = 0; i < names.length; i++) {
                var f = p.items.addFolder(names[i]);
                if (i === 0) { compFolder = f; }
            }
        } else {
            for (i = 0; i < tplComps.length && !compFolder; i++) {
                if (tplComps[i].parentFolder !== p.rootFolder) { compFolder = tplComps[i].parentFolder; }
            }
            for (i = 1; i <= p.rootFolder.numItems && !compFolder; i++) {
                it = p.rootFolder.item(i);
                if (it instanceof FolderItem && /comps?\b|projects?\b|main/i.test(it.name) && !/pre/i.test(it.name)) { compFolder = it; }
            }
            if (!compFolder) { compFolder = p.items.addFolder('00 Comps'); }
            for (i = 0; i < tplComps.length; i++) {
                if (tplComps[i].numLayers === 0 && tplComps[i].usedIn.length === 0) { tplComps[i].remove(); }
            }
        }

        var sizes = [['_16X9', 1920, 1080], ['_9X16', 1080, 1920], ['_4X5', 1080, 1350]];
        var comps = [];
        for (i = 0; i < sizes.length; i++) {
            var c = p.items.addComp(J.base + sizes[i][0], sizes[i][1], sizes[i][2], 1.0, J.duration, J.fps);
            c.bgColor = J.bg;
            c.parentFolder = compFolder;
            comps.push(c);
        }

        if (!p.save(target)) { throw new Error('After Effects could not save ' + target.fsName); }

        if (J.close) {
            p.close(CloseOptions.DO_NOT_SAVE_CHANGES);   // saved just above
        } else {
            comps[0].openInViewer();
            p.save();
        }
        writeText(J.result, 'OK\n' + target.fsName);
    } catch (e) {
        writeText(J.result, 'ERROR\n' + e.toString() + (e.line ? ' (AEHere.jsx line ' + e.line + ')' : ''));
    }
})(AEHERE);
