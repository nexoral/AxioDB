const { AxioDB } = require('./lib/config/DB.js')

new AxioDB({ GUI: true, TCP: true, TCPAuth: true, RootName: "AxioDB"});