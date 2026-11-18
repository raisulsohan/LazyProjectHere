// LazyProjectHere for macOS (beta) - JavaScript for Automation, run by the
// Finder Quick Actions that Install.command makes:
//   osascript -l JavaScript lazyprojecthere.js ae|premiere <folder or file> ...
// The first item is used; for a file, its folder is used.
//
//   ae        makes "<folder>.aep" in After Effects (AEHere.jsx, sent with
//             AppleScript DoScript), opens it, points Import at the folder.
//   premiere  writes "<folder>.prproj" from template.prproj (it already holds
//             the 3 sequences), points Import at the folder while Premiere Pro
//             is closed, opens it.
// Comps / sequences: <folder>_16X9 1920x1080, _9X16 1080x1920, _4X5 1080x1350, 30 fps.
// Log: ~/Library/Logs/LazyProjectHere.log

ObjC.import('Foundation');

var app = Application.currentApplication();
app.includeStandardAdditions = true;

var HOME = $.NSHomeDirectory().js;
var TOOL = HOME + '/Library/Application Support/LazyProjectHere';
var LOG = HOME + '/Library/Logs/LazyProjectHere.log';

// Comp settings (After Effects)
var DURATION = 30;      // seconds
var FPS = 30;
var BG = '[0, 0, 0]';   // black, 0-1 per channel

var TITLE = 'LazyProjectHere';

function q(s) { return "'" + String(s).replace(/'/g, "'\\''") + "'"; }               // for the shell
function sh(cmd) { return app.doShellScript(cmd, { alteringLineEndings: false }); }
function asStr(s) { return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'; }  // AppleScript string

function log(msg) {
    try {
        var stamp = sh('date "+%Y-%m-%dT%H:%M:%S"').replace(/\s+$/, '');
        sh('mkdir -p ' + q(HOME + '/Library/Logs') + ' && printf "%s\\n" ' + q(stamp + '  ' + msg) + ' >> ' + q(LOG));
    } catch (e) {}
}

function showError(msg) {
    log('ERROR: ' + msg);
    try { app.displayAlert(TITLE, { message: msg, as: 'critical' }); } catch (e) {}
}

function exists(p) { return $.NSFileManager.defaultManager.fileExistsAtPath(p); }
function isDir(p) {
    var d = Ref();
    return $.NSFileManager.defaultManager.fileExistsAtPathIsDirectory(p, d) && d[0];
}
function readText(p) {
    var s = $.NSString.stringWithContentsOfFileEncodingError(p, $.NSUTF8StringEncoding, null);
    if (s.isNil()) { throw new Error('Could not read ' + p); }
    return s.js;
}
function writeText(p, text) {
    if (!$(text).writeToFileAtomicallyEncodingError(p, true, $.NSUTF8StringEncoding, null)) {
        throw new Error('Could not write ' + p);
    }
}
function xmlEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); }
function reEsc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// An ExtendScript string literal that is pure ASCII (any folder name).
function jsStr(s) {
    var out = '"';
    for (var i = 0; i < s.length; i++) {
        var c = s.charCodeAt(i);
        if (c >= 32 && c < 127 && s[i] !== '"' && s[i] !== '\\') { out += s[i]; }
        else { out += '\\u' + ('000' + c.toString(16)).slice(-4); }
    }
    return out + '"';
}

// Newest "/Applications/Adobe <name> <year>/Adobe <name> <year>.app".
function findApp(name) {
    var list = sh('ls -1 /Applications').split('\n');
    var best = null, bestYear = -1;
    for (var i = 0; i < list.length; i++) {
        var m = list[i].match(new RegExp('^' + reEsc(name) + ' (\\d{4})$'));
        if (!m) { continue; }
        var appPath = '/Applications/' + list[i] + '/' + list[i] + '.app';
        if (exists(appPath) && +m[1] > bestYear) { best = appPath; bestYear = +m[1]; }
    }
    return best;
}
function appName(appPath) { return appPath.replace(/^.*\//, '').replace(/\.app$/, ''); }
function plistValue(appPath, key) {
    try { return sh('/usr/bin/defaults read ' + q(appPath + '/Contents/Info') + ' ' + key).replace(/\s+$/, ''); }
    catch (e) { return ''; }
}
function isRunning(appPath) {
    try { return Application(appPath).running(); } catch (e) { return false; }
}

// "<folder>.<ext>", or "<folder>_2.<ext>", "_3" ... if that exists.
function newProjectPath(folder, base, ext) {
    var p = folder + '/' + base + '.' + ext, n = 2;
    while (exists(p)) { p = folder + '/' + base + '_' + n + '.' + ext; n++; }
    return p;
}

// --- After Effects -------------------------------------------------------

function aeDoScript(aeApp, code, seconds) {
    var src = TOOL + '/jobs/send-' + Date.now() + '.applescript';
    writeText(src, 'with timeout of ' + seconds + ' seconds\n' +
        'tell application ' + asStr(appName(aeApp)) + ' to DoScript ' + asStr(code) + '\n' +
        'end timeout\n');
    try { return sh('/usr/bin/osascript ' + q(src)); }
    finally { try { sh('rm -f ' + q(src)); } catch (e) {} }
}

function makeAE(folder, base) {
    var aeApp = findApp('Adobe After Effects');
    if (!aeApp) { throw new Error('Adobe After Effects was not found in /Applications.'); }
    var mainJsx = TOOL + '/AEHere.jsx';
    if (!exists(mainJsx)) { throw new Error('Missing file: ' + mainJsx); }
    var proj = newProjectPath(folder, base, 'aep');
    log('Folder: ' + folder + ' -> ' + proj + ' (After Effects: ' + aeApp + ')');

    sh('mkdir -p ' + q(TOOL + '/jobs'));
    var job = TOOL + '/jobs/job-' + Date.now() + '.jsx';
    writeText(job, 'var AEHERE = {\n' +
        '    folder: ' + jsStr(folder) + ',\n' +
        '    project: ' + jsStr(proj) + ',\n' +
        '    base: ' + jsStr(base) + ',\n' +
        '    result: "",\n' +
        '    duration: ' + DURATION + ', fps: ' + FPS + ', bg: ' + BG + ',\n' +
        '    close: false\n' +
        '};\n' +
        '$.evalFile(new File(' + jsStr(mainJsx) + '));\n');

    try {
        // Start After Effects if needed and wait until it takes scripts.
        if (!isRunning(aeApp)) {
            log('Starting After Effects.');
            sh('/usr/bin/open -a ' + q(aeApp));
        }
        var t0 = Date.now(), ready = false, lastErr = '';
        while (!ready) {
            try { aeDoScript(aeApp, 'app.version', 20); ready = true; }
            catch (e) {
                lastErr = String(e);
                if (/-1743|not authori[sz]ed|Not allowed/i.test(lastErr)) {
                    throw new Error('macOS did not allow LazyProjectHere to control After Effects.\n\n' +
                        'Open System Settings > Privacy & Security > Automation and turn on "Adobe After Effects" ' +
                        'for the app listed there (Finder, Automator or osascript), then try again.');
                }
                if (Date.now() - t0 > 300000) { throw new Error('After Effects did not answer within 5 minutes. ' + lastErr); }
                delay(2);
            }
        }

        // A "Save changes?" question in After Effects can take a while.
        var answer = aeDoScript(aeApp, '$.evalFile(new File(' + jsStr(job) + '))', 1800).replace(/\s+$/, '');
        var head = answer.split('\n')[0];
        if (!answer && exists(proj)) { head = 'OK'; }     // in case DoScript gives no value back
        if (head === 'OK') {
            log('Created and opened ' + proj);
            // The Import dialog is a macOS open panel: it starts in the
            // folder kept in the app's NSNavLastRootDirectory (beta: not tested).
            var bundleId = plistValue(aeApp, 'CFBundleIdentifier');
            if (bundleId) {
                try {
                    sh('/usr/bin/defaults write ' + q(bundleId) + ' NSNavLastRootDirectory -string ' + q(folder));
                    log('Import folder set (' + bundleId + '): ' + folder);
                } catch (e) { log('Import folder not set: ' + e); }
            }
        } else if (head === 'CANCELLED') {
            log('Cancelled in After Effects (the open project was not closed).');
        } else {
            throw new Error('After Effects: ' + answer.replace(/\n/g, ' '));
        }
    } finally {
        try { sh('rm -f ' + q(job)); } catch (e) {}
    }
}

// --- Premiere Pro --------------------------------------------------------

function setTag(xml, tag, value) {
    var line = '<' + tag + '>' + xmlEsc(value) + '</' + tag + '>';
    var rx = new RegExp('<' + reEsc(tag) + '>[^<]*</' + reEsc(tag) + '>');
    if (rx.test(xml)) { return xml.replace(rx, function () { return line; }); }
    var i = xml.indexOf('</Properties>');
    return i >= 0 ? xml.slice(0, i) + line + '\n\t\t\t\t' + xml.slice(i) : xml;
}

function makePremiere(folder, base) {
    var prApp = findApp('Adobe Premiere Pro');
    if (!prApp) { throw new Error('Adobe Premiere Pro was not found in /Applications.'); }
    var template = TOOL + '/template.prproj';
    if (!exists(template)) { throw new Error('Missing file: ' + template); }
    var proj = newProjectPath(folder, base, 'prproj');
    log('Folder: ' + folder + ' -> ' + proj + ' (Premiere Pro: ' + prApp + ')');

    // template.prproj is gzipped XML
    var xml = sh('/usr/bin/gzip -dc ' + q(template));
    var b = xmlEsc(base);
    xml = xml.split('<Name>1920x1080 30fps</Name>').join('<Name>' + b + '_16X9</Name>');
    xml = xml.split('<Name>1080x1920 30fps</Name>').join('<Name>' + b + '_9X16</Name>');
    xml = xml.split('<Name>1080x1350 30fps</Name>').join('<Name>' + b + '_4X5</Name>');
    var parent = folder.replace(/\/[^\/]*$/, '') || '/';
    xml = setTag(xml, 'project.settings.lastknowngoodprojectpath', proj);
    xml = setTag(xml, 'project.settings.lastknownparentdirectorypathaboveprojectpath', parent);
    sh('mkdir -p ' + q(TOOL + '/jobs'));
    var tmp = TOOL + '/jobs/project-' + Date.now() + '.xml';
    writeText(tmp, xml);
    try { sh('/usr/bin/gzip -c ' + q(tmp) + ' > ' + q(proj)); }
    finally { sh('rm -f ' + q(tmp)); }
    log('Created ' + proj);

    // Import folder: be.prefs.last.used.directory in the Premiere prefs.
    // Premiere writes its prefs when it quits, so only while it is closed.
    if (isRunning(prApp)) {
        log('Premiere Pro is already running: Import folder not changed.');
    } else {
        var major = (plistValue(prApp, 'CFBundleShortVersionString').match(/^\d+/) || [''])[0];
        var verDir = HOME + '/Documents/Adobe/Premiere Pro/' + major + '.0';
        var files = [];
        try { files = sh('ls -1d ' + q(verDir) + '/Profile-*/"Adobe Premiere Pro Prefs" 2>/dev/null || true').split('\n'); } catch (e) {}
        var tag = 'be.prefs.last.used.directory';
        for (var i = 0; i < files.length; i++) {
            var pf = files[i];
            if (!pf || !exists(pf)) { continue; }
            try {
                if (!exists(pf + '.premierehere.bak')) { sh('cp ' + q(pf) + ' ' + q(pf + '.premierehere.bak')); }
                var text = readText(pf);
                var line = '<' + tag + '>' + xmlEsc(folder) + '</' + tag + '>';
                var rx = new RegExp('<' + reEsc(tag) + '>[^<]*</' + reEsc(tag) + '>');
                if (rx.test(text)) { text = text.replace(rx, function () { return line; }); }
                else if (text.indexOf('</Properties>') >= 0) {
                    var k = text.lastIndexOf('</Properties>');
                    text = text.slice(0, k) + '\t' + line + '\n\t\t' + text.slice(k);
                } else { log('Unknown prefs format, skipped: ' + pf); continue; }
                writeText(pf, text);
                log('Import folder set in ' + pf);
            } catch (e) { log('Import folder not set in ' + pf + ': ' + e); }
        }
    }

    sh('/usr/bin/open -a ' + q(prApp) + ' ' + q(proj));
    log('Opened ' + proj);
}

// --- start ---------------------------------------------------------------

function run(argv) {
    try {
        var kind = argv[0];
        var item = argv[1];
        if ((kind !== 'ae' && kind !== 'premiere') || !item) {
            throw new Error('Usage: lazyprojecthere.js ae|premiere <folder>');
        }
        item = item.replace(/\/+$/, '') || '/';
        if (!exists(item)) { throw new Error('Not found: ' + item); }
        var folder = isDir(item) ? item : (item.replace(/\/[^\/]*$/, '') || '/');
        var base = folder.replace(/^.*\//, '');
        if (!base) { base = 'Project'; }                 // the disk itself
        base = base.replace(/[\/:]/g, '_');
        if (kind === 'ae') { makeAE(folder, base); } else { makePremiere(folder, base); }
    } catch (e) {
        showError(String(e.message || e));
    }
}
