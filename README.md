
# About project

NUWEE optional subjects list parser

For `https://desk.nuwm.edu.ua/cgi-bin/classman.cgi?n=3`

---

### Usage

1. Install Node.js
1. Install dependencies via `npm i` or `yarn` (if installed)
1. Rename `startup.example.json` to `startup.json`
1. Configure `startup.json` according to instructions below
1. Run script via `node .`

---

### Configuration

* `parallel`: boolean
  
  Enables parallel execution mode. Semester ordering is not guaranteed

* `sessionId`: string
  
  User Session ID. Go to `https://desk.nuwm.edu.ua/cgi-bin/classman.cgi?n=3`, sign in, copy Session ID from value of `sesID` query key and paste here

* `verifiedTeachers`: array { string }
  
  Names (or name parts) of your favourite teachers