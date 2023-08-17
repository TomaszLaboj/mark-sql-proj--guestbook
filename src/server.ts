import express from "express";
import cors from "cors";
import { Client } from "pg";

//As your database is on your local machine, with default port,
//and default username and password,
//we only need to specify the (non-default) database name.

const client = new Client({ database: 'guestbook' });

//TODO: this request for a connection will not necessarily complete before the first HTTP request is made!

client.connect();
  

const app = express();

/**
 * Simplest way to connect a front-end. Unimportant detail right now, although you can read more: https://flaviocopes.com/express-cors/
 */
app.use(cors());

/**
 * Middleware to parse a JSON body in requests
 */
app.use(express.json());

//When this route is called, return the most recent 100 signatures in the db
app.get("/signatures", async (req, res) => {
  const signatures = await client.query("SELECT * FROM signatures ORDER BY time DESC LIMIT 100;")
  res.status(200).json({
    status: "success",
    data: {
      signatures
    },
  });
});

app.get("/signatures/:id", async (req, res) => {
  try { 
    const { id } = req.params;
    const entry = await client.query("SELECT * FROM signatures WHERE id=$1",[id])
   res.status(200).json({
    status: "success",
    data: {entry}
   })
    
  } catch {
    res.status(404).json({
      status: "couldn't get this id"
    })
   
  }
});

app.post("/signatures", async (req, res) => {
  const { name, message } = req.body;
  if (typeof name === "string") {
    await client.query("INSERT INTO signatures (signature,message) values($1, $2)",[name, message])

    res.status(201).json({
      status: "success",
     
    });
  } else {
    res.status(400).json({
      status: "fail",
      data: {
        name: "A string value for name is required in your JSON body",
      },
    });
  }
});

//update a signature.
app.put("/signatures/:id", async (req, res) => {
  //  :id refers to a route parameter, which will be made available in req.params.id
  const { name, message } = req.body;
  console.log({name,message})
  const id = parseInt(req.params.id);
  console.log(id)
  if (typeof name === "string") {

    const result: any = await client.query("UPDATE signatures SET signature = $2, message = $3 WHERE id=$1;",[id,name,message])
   console.log(result)
    if (result.rowCount === 1) {
      const updatedSignature = result.rows[0];
      res.status(200).json({
        status: "success",
        data: {
          signature: updatedSignature,
        },
      });
    } else {
      res.status(404).json({
        status: "fail",       
        data: {
          id: "Could not find a signature with that id identifier",
        },
      });

    }
  } else {
    res.status(400).json({
      status: "fail",
      data: {
        name: "A string value for name is required in your JSON body",
      },
    });
  }
});

app.delete("/signatures/:id", async (req, res) => {
  const id = parseInt(req.params.id); // params are string type

  const queryResult: any = await client.query ("DELETE FROM signatures WHERE id=$1",[id])
  const didRemove = queryResult.rowCount === 1;

  if (didRemove) {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/DELETE#responses
    // we've gone for '200 response with JSON body' to respond to a DELETE
    //  but 204 with no response body is another alternative:
    //  res.status(204).send() to send with status 204 and no JSON body
    res.status(200).json({
      status: "success",
    });
  } else {
    res.status(404).json({
      status: "fail",
      data: {
        id: "Could not find a signature with that id identifier",
      },
    });
  }
});

export default app;
