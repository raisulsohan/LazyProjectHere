<div align="center">

# LazyProjectHere

**যেকোনো ফোল্ডারে রাইট-ক্লিক করুন। ফোল্ডারের নামে After Effects বা Premiere Pro project তৈরি হয়।**

ভিডিও এডিটর আর মোশন ডিজাইনারদের জন্য Windows-এর ছোট একটা রাইট-ক্লিক টুল।

[Read in English](README.md) · [Download](https://github.com/raisulsohan/LazyProjectHere/releases/latest)

</div>

## যা করে

ফোল্ডারের ভেতরে (বা ফোল্ডারের আইকনে, বা ড্রাইভে) রাইট-ক্লিক করুন। দুটো অপশনের একটা বেছে নিন:

- **New After Effects project here**
- **New Premiere Pro project here**

"My Video" ফোল্ডারে তৈরি হয় `My Video.aep` বা `My Video.prproj`। ভেতরে থাকে:

| Comp / sequence | মাপ | |
|---|---|---|
| `My Video_16X9` | 1920x1080 | খোলা থাকে |
| `My Video_9X16` | 1080x1920 | |
| `My Video_4X5` | 1080x1350 | |

তিনটাই 30 fps। Project app-এ খোলে। **Import (Ctrl+I) ওই ফোল্ডারেই খোলে।**

একই নামের project থাকলে নতুনটার নামের শেষে `_2`, `_3` যোগ হয়। পুরোনো ফাইল কখনো মোছে না।

### After Effects

- Comp: 30 সেকেন্ড, কালো background, square pixel।
- ফোল্ডার: `00 Comps` (তিনটা comp এখানে), `01 Footage`, `02 Audio`, `03 Graphics`, `04 Music`, `05 Photos`।
- **আপনার New Project Template ব্যবহার হয়** (Preferences > New Project)। Template-এর ফোল্ডারগুলো থাকে। তিনটা comp যায় template-এর comp যে ফোল্ডারে আছে সেখানে। Template-এর খালি comp মুছে যায়, নতুন তিনটা comp তার জায়গা নেয়।
- After Effects খোলা বা বন্ধ, দুই অবস্থাতেই কাজ করে। Save না করা পরিবর্তন থাকলে After Effects আগে save করতে বলে। Cancel চাপলে কিছুই বদলায় না।
- After Effects খোলা থাকলেও Import ফোল্ডার বদলায়।
- duration, fps বা রং বদলাতে: `AE\AEHere.ps1`-এর উপরের `Comp settings` অংশ বদলান।

### Premiere Pro

- Bin: `01 Footage`, `02 Audio`, `03 Graphics`, `04 Music`, `05 Photos`।
- Import ফোল্ডার বদলায় শুধু Premiere বন্ধ থাকলে (Premiere বন্ধ হওয়ার সময় নিজের prefs আবার লেখে)।
- নিজের template চাইলে: একটা খালি project `template.prproj` নামে ইনস্টল ফোল্ডারের `Premiere` ফোল্ডারে রাখুন।

## ইনস্টল

1. [Releases](https://github.com/raisulsohan/LazyProjectHere/releases/latest) থেকে `LazyProjectHere.zip` নামিয়ে Extract করুন।
2. `Install.cmd`-এ ডাবল-ক্লিক করুন।
3. উইন্ডোতে "Installed to" দেখালে যেকোনো key চাপুন।

টুলটা `%USERPROFILE%\Tools\LazyProjectHere`-এ ইনস্টল হয়। Admin লাগে না। যে app PC-তে নেই, তার মেনু যোগ হয় না। আগের আলাদা PremiereHere বা AEHere থাকলে সেগুলো সরে যায়, নিজের `template.prproj` থাকে।

Windows 11-এ অপশনগুলো **Show more options**-এর ভেতরে থাকতে পারে। Shift চেপে রাইট-ক্লিক করলে সরাসরি দেখায়।

সরাতে: `Uninstall.cmd`-এ ডাবল-ক্লিক করুন। বানানো project-গুলো থেকে যায়।

Windows 11, After Effects 2027 আর Premiere Pro 2027-এ পরীক্ষা করা।

## License

[MIT](LICENSE)
