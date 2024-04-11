const { error } = require('console');
const http = require('http');
const Koa = require('koa');
const { koaBody } = require('koa-body');
const bodyParser = require('koa-bodyparser');
const { v4: uuidv4 } = require('uuid');

let tickets = [];

const app = new Koa();

app.use(koaBody({
  urlencoded: true,
  json: true,
}));

app.use(bodyParser());

app.use((ctx, next) => {
  ctx.response.body = 'Server response';

  if (ctx.request.method !== 'OPTIONS') {
    next();

    return;
  }

  ctx.response.set('Access-Control-Allow-Origin', '*');

  ctx.response.set('Access-Control-Allow-Methods', 'GET, POST');

  ctx.response.set('Access-Control-Allow-Headers', 'Content-Type');

  ctx.response.status = 204;

  next();
});


app.use((ctx, next) => {
  
  if (ctx.request.method === 'GET' && ctx.request.url.includes('method=allTickets')) {
  
    ctx.response.set('Access-Control-Allow-Origin', '*');

    if (tickets.length > 0) {
      ctx.response.body = JSON.stringify(tickets);
    } else {
      ctx.response.status = 204;
    }
    } else {
      next();
    }
});


app.use((ctx, next) => {

  if (ctx.request.method === 'POST' && ctx.request.url.includes('method=createTicket')) {

    ctx.response.set('Access-Control-Allow-Origin', '*');

    const { name, description, status, created } = ctx.request.body;

    if (tickets.some(t => t.name === name)) {
      ctx.response.body = JSON.stringify({ error: 'Ticket already exists' });

      return;
    }

    const ticket = {
      name,
      description: description.split('\n'),
      id: uuidv4(),
      status,
      created,
    };

    tickets.push(ticket);

    ctx.response.body = JSON.stringify(ticket);
    
    } else {
      next();
    }
});


app.use((ctx, next) => {

  if (ctx.request.method === 'POST' && ctx.request.url.includes('method=updateById')) {

    ctx.response.set('Access-Control-Allow-Origin', '*');
  
    const { id } = ctx.request.query;
  
    if (!tickets.find(t => t.id === id)) {
      ctx.response.status = 400;
      ctx.response.body = 'Server error';
  
      return;
    }

    const ticket = tickets.find((t) => t.id === id);

    if (ctx.request.body.status !== undefined) {
      ticket.status = ctx.request.body.status;
    } else {
      const { name, description } = ctx.request.body;
      console.log(name, description);

      let ticketsCount = 1;
  
      tickets.forEach(t => {
        if (t.name === name && t.description === description) {
          ticketsCount++;
        }
      });
  
      if (ticketsCount > 1) {
        ctx.response.body = JSON.stringify({ error: 'Ticket already exists' });
    
        return;
      }
  
      ticket.name = name;
      ticket.description  = description.split('\n');
    }

    console.log(ticket);
    
    ctx.response.body = JSON.stringify(ticket);
  } else {
    next();
  }
});


app.use((ctx, next) => {

  if (ctx.request.method === 'GET' && ctx.request.url.includes('method=ticketById')) {

    ctx.response.set('Access-Control-Allow-Origin', '*');

    const { id } = ctx.request.query;

    if (!tickets.find(t => t.id === id)) {
      ctx.response.status = 400;
      ctx.response.body = 'Server error';
  
      return;
    }
  
    const ticket = tickets.find((t) => t.id === id);
  
    ctx.response.body = JSON.stringify(ticket);
  } else {
    next();
  }
});


app.use((ctx) => {
  if (ctx.request.method === 'GET' && ctx.request.url.includes('method=deleteById')) {
    ctx.response.set('Access-Control-Allow-Origin', '*');

    const { id } = ctx.request.query;

    if (!tickets.find(t => t.id === id)) {
      ctx.response.status = 400;
      ctx.response.body = 'Server error';
  
      return;
    }

    tickets = tickets.filter(t => t.id !== id);

    ctx.response.body = JSON.stringify(tickets);

  }
});

const server = http.createServer(app.callback());

const port = 8080;

server.listen(port, (err) => {
  if (err) {
    console.log(err);
    return
  }
  console.log('Server is listening to ' + port);
});
