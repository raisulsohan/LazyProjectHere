"""Makes the two release downloads next to this folder:

  LazyProjectHere.zip      Windows: Install.cmd, Uninstall.cmd, README.txt, LICENSE, setup/
  LazyProjectHere-mac.zip  Mac (beta): LazyProjectHere-mac/ with Install.command,
                           Uninstall.command, README.txt, LICENSE and files/
                           (lazyprojecthere.js, AEHere.jsx, template.prproj)

The Mac zip stores Unix file modes, so the .command files stay runnable.
Run: python build-zip.py
"""
import hashlib
import os
import time
import zipfile

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(ROOT)


def add(z, src, name, mode=0o644, lf=False):
    with open(src, 'rb') as f:
        data = f.read()
    if lf:
        data = data.replace(b'\r\n', b'\n')
    info = zipfile.ZipInfo(name, time.localtime(os.path.getmtime(src))[:6])
    info.compress_type = zipfile.ZIP_DEFLATED
    info.create_system = 3                      # Unix, so the mode below counts
    info.external_attr = (0o100000 | mode) << 16
    z.writestr(info, data)


def done(path):
    h = hashlib.sha256(open(path, 'rb').read()).hexdigest()
    print(f'{path}\n  SHA-256: {h}')


def windows():
    path = os.path.join(OUT, 'LazyProjectHere.zip')
    with zipfile.ZipFile(path, 'w') as z:
        for name in ('Install.cmd', 'Uninstall.cmd', 'README.txt', 'LICENSE'):
            add(z, os.path.join(ROOT, name), name)
        for base, _, files in os.walk(os.path.join(ROOT, 'setup')):
            for fn in sorted(files):
                if fn.endswith('.log'):
                    continue
                src = os.path.join(base, fn)
                add(z, src, os.path.relpath(src, ROOT).replace(os.sep, '/'))
    done(path)


def mac():
    path = os.path.join(OUT, 'LazyProjectHere-mac.zip')
    top = 'LazyProjectHere-mac/'
    m = os.path.join(ROOT, 'mac')
    with zipfile.ZipFile(path, 'w') as z:
        add(z, os.path.join(m, 'Install.command'), top + 'Install.command', 0o755, lf=True)
        add(z, os.path.join(m, 'Uninstall.command'), top + 'Uninstall.command', 0o755, lf=True)
        add(z, os.path.join(m, 'README.txt'), top + 'README.txt', lf=True)
        add(z, os.path.join(ROOT, 'LICENSE'), top + 'LICENSE', lf=True)
        add(z, os.path.join(m, 'lazyprojecthere.js'), top + 'files/lazyprojecthere.js', lf=True)
        add(z, os.path.join(ROOT, 'setup', 'AE', 'AEHere.jsx'), top + 'files/AEHere.jsx', lf=True)
        add(z, os.path.join(m, 'template.prproj'), top + 'files/template.prproj')
        add(z, os.path.join(m, 'Uninstall.command'), top + 'files/Uninstall.command', 0o755, lf=True)
    done(path)


if __name__ == '__main__':
    windows()
    mac()
