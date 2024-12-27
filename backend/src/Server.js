import express from 'express';
import { Payment, MercadoPagoConfig, Preference } from 'mercadopago';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(cors());

// Configuração do MercadoPago
const client = new MercadoPagoConfig({
  accessToken: 'TEST-266725179599368-122416-98be4e6b5871117c933fc28cdc5115fd-1186084980',
  sandbox: true
});
const payment = new Payment(client);
const preference = new Preference(client);

// Rota para criar a preferência
app.post('/create_preference', (req, res) => {
  console.log(req.body)

  preference.create({
    body: {
      items: [
        {
          quantity: req.body.quantity,
          unit_price: req.body.price,
          description: req.body.description
        },
      ],
      purpose: "wallet_purchase",
      back_urls: {
        success: "http://localhost:3000/success",
        failure: "http://localhost:3000/failure",
        pending: "http://localhost:3000/pending",
      },
      auto_return: "approved", // Isso garantirá que, em caso de pagamento aprovado, o MercadoPago redirecione automaticamente
    },
  })
    .then((response) => {
      console.log(response)
      res.json({ preferenceId: response.id, response });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error creating preference');
    });
});

// Rota para processar o pagamento
app.post('/process_payment', (req, res) => {
  payment.create({ body: req.body })
    .then((response) => {
      console.log(response);
      res.json(response);
    })
    .catch(console.log);
});

// Inicia o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
