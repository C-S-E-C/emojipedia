with open("names.list", "r") as file:
    names = file.readlines()
id = 0xf0000
id_css = '@import url("style.css");\n'
README_md = """# Emojipedia

##### A frontend icon resp
[github](https://github.com/C-S-E-C/emojipedia)
## Usage
1. RECOMMENDED<br  />
   get latest reslese<br  />
   a. add `https://c-s-e-c.github.io/emojipedia/id.css` in head<br  />
   not needed but recommended: adding colors: some logos have colors if you also want colors add`https://c-s-e-c.github.io/emojipedia/color.css` in head<br  />
   b. add `class="csecicon-csecicon-[name]"`
2. FAST<br  />
   add `https://c-s-e-c.github.io/emojipedia/old.css` in head<br  />
   add `[class^="csecicon"], [class*=" csecicon"] {font-family: 'CSEC-font-library-[version]' !important;}` in style<br  />
   add `class="csecicon-csecicon"`<br  />
   add content in elements like `\\f0000`
3. NOT RECOMMENDED<br  />
   This make your site not stable,you will need to update your site as we change the id of icons.<br  />
   add `https://c-s-e-c.github.io/emojipedia/style.css` in head<br  />
   add `class="csecicon-csecicon"`<br  />
   add content in elements like `\\f0000`

# Credits
<table>
<tr><td>Area</td><td>Arthur</td></tr>
<tr><td>0xf03a7 - 0xf03b6</td><td>Keyamoon</td></tr>
</table>

# Sections
<table>
<tr><td>Area</td><td>Name</td></tr>
<tr><td>0xf0000 - 0xf03a6</td><td>logos</td></tr>
<tr><td>0xf03a7 - 0xf03b6</td><td>Icons</td></tr>
</table>

# Table
Github Readme displays the icons below wrong,however you can view them on the [homepage](https://c-s-e-c.github.io/emojipedia/) 
<link rel="stylesheet" href="id.css">
<button onclick="document.body.innerHTML += `<link rel='stylesheet' href='color.css'>`">Enable Colors</button>
<table>
<tr><td>Unicodehex</td><td>name</td><td>icon</td></tr>"""
for name in names:
    name = name.strip()
    README_md += f"\n<tr><td>{hex(id)}</td><td>{name}</td><td class=\"csecicon-{name}\"></td></tr>"
    id_css += f'.csecicon-{name}:before {{ content: "\\{hex(id)[2:]}"; }}\n'
    id += 1
README_md += "\n</table>"
with open("README.md", "w") as file:
    file.write(README_md)
with open("id.css", "w") as file:
    file.write(id_css)