# Checkout Transparente com Mercado Pago
Este projeto implementa um Checkout Transparente utilizando a API do Mercado Pago. O objetivo é permitir que o usuário realize o pagamento sem sair da página, utilizando diferentes métodos de pagamento como boleto, transferência bancária, cartão de crédito e débito, tudo de forma transparente.

## 1. Instalação

Certifique-se de que a biblioteca do Mercado Pago está instalada no seu projeto React.

```jsx
: install @mercadopago/sdk-react axios
```

## 2. Inicialização do Mercado Pago

Inicialize o Mercado Pago com a chave pública de teste:

```jsx
import { initMercadoPago } from '@mercadopago/sdk-react';

initMercadoPago('SUA_CHAVE_PUBLICA', { locale: 'pt-BR' });
```

- `SUA_CHAVE_PUBLICA`: Substitua pela sua chave pública obtida no painel do Mercado Pago.
- `locale`: Configura o idioma para o checkout.

## 3. Configuração do Componente

Estrutura básica do componente `App`:

### 3.1. Estados

Definimos estados para armazenar informações importantes:

- `preferencedId`: Usado para inicializar o pagamento.
- `paymentId`: Armazena o ID do pagamento após o processamento.

```jsx
import { Payment, StatusScreen } from '@mercadopago/sdk-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [preferenceId, setPreferenceId] = useState('');
  const [paymentId, setPaymentId] = useState(null);
```

### 3.2. Dados do Produto

Os dados do produto aqui são estáticos, simulando um carrinho:

```jsx
const productDataUpdated = {
  description: "Macbook Air",
  quantity: 1,
  price: 1200,  
};
```

### 3.3. Buscar `preferenceId` no servidor

Use a API do servidor para criar uma preferência e retornar o `preferenceId`. Esse ID conecta o frontend ao backend do Mercado Pago.

```jsx
useEffect(() => {
  const getPreferenceId = async () => {
    try {
      const response = await axios.post('http://localhost:5000/create_preference', productDataUpdated, {
        headers: { "Content-type": "application/json" }
      });
      setPreferenceId(response.data.preferenceId);
    } catch (error) {
      console.error("Erro ao criar preferência:", error);
    }
  };
  getPreferenceId();
}, []);
```

## 4. Configurações do Checkout

### 4.1. Inicialização

Inclua o valor e o `preferencedId`:

```jsx
const initialization = {
  amount: productDataUpdated.price,
  preferenceId: preferenceId,
};
```

### 4.2. Personalização

Configure os métodos de pagamento e URLs de redirecionamento:

```jsx
const customization = {
  paymentMethods: {
    ticket: "all",
    bankTransfer: "all",
    creditCard: "all",
    debitCard: "all",
    mercadoPago: "all",
  },
  autoReturn: "approved",
  back_urls: {
    success: "http://localhost:3000/success",
    failure: "http://localhost:3000/failure",
    pending: "http://localhost:3000/pending",
  },
  visual: {
    showExternalReference: true,
    hideStatusDetails: true,
    hideTransactionDate: true,
    style: { theme: 'default' },
  },
};
```

## 5. Funções de Callback

### 5.1. Processar o Pagamento

Envie os dados do pagamento para o backend e capture o `paymentId` para usar depois no Status Screen caso necessite:

```jsx
const onSubmit = async ({ selectedPaymentMethod, formData }) => {
  
	// Atualizando o formData para incluir a descrição para depois usar no Status Screen

  const formDataUpd = {
    ...formData,
    description: productDataUpdated.description,
  };

  try {
    const response = await axios.post("http://localhost:5000/process_payment", formDataUpd, {
      headers: { 'Content-Type': 'application/json' },
    });
    setPaymentId(response.data.id);
    return response.data;
  } catch (error) {
    console.error('Erro ao processar o pagamento:', error);
    throw error;
  }
};

```

### 5.2. Tratamento de Erros

Exiba erros caso a integração falhe:

```jsx
const onError = (error) => {
  console.error('Erro na integração do MercadoPago:', error);
};
```

## 6. Renderização do Componente

Utilize os componentes `Payment` e `StatusScreen` para exibir o checkout e o status do pagamento.

```jsx
return (
  <>
    <Payment
      initialization={initialization}
      customization={customization}
      onSubmit={onSubmit}
      onReady={() => console.log('MercadoPago pronto')}
      onError={onError}
    />
    {paymentId && (
      <StatusScreen
        initialization={{ paymentId }}
        customization={customization}
      />
    )}
  </>
);

```

## 7. Backend (Exemplo com Node.js)

### 7.1. Configuração do ambiente

Antes de iniciar, instale as dependências necessárias para o backend:

```jsx
npm install express mercadopago cors
```

### 7.2. Configuração do Mercado Pago

O SDK do Mercado Pago é configurado utilizando o `access_token`. Esse token é obtido no painel do Mercado Pago, na seção de credenciais de API. O `sandBox: true` ativa o ambiente de testes.

```jsx
import express from 'express';
import { Payment, MercadoPagoConfig, Preference } from 'mercadopago';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(cors());

// Configuração do MercadoPago
const client = new MercadoPagoConfig({
  accessToken: 'TEST-266725179599368-122416-98be4e6b5871117c933fc28cdc5115fd-1186084980',
  sandbox: true, // Configuração de teste
});
const payment = new Payment(client);
const preference = new Preference(client);
```

### 7.3. Rota para Criar Preferência

A preferência é a chave para o checkout transparente. Ela contém todos os detalhes sobre os itens que o usuário está comprando e as URLs para redirecionamento após o pagamento.

Passos: 

1. Receber os Dados do Frontend
    
    O frontend envia os dados do produto (como descrição, quantidade e preço) para o backend.
    
    ```jsx
    app.post('/create_preference', (req, res) => {
      console.log(req.body);  // Exibe os dados enviados do frontend
    ```
    
2. Criar a Preferência
    
    Utilizamos o método `preference.create` para criar a preferência no Mercado Pago. A preferência inclui:
    
    - Itens comprados (quantidade, preço, descrição).
    - URLs de retorno após o pagamento (sucesso, falha ou pendente).
    - Configuração de auto-retorno: se o pagamento for aprovado, o Mercado Pago redireciona automaticamente o usuário para a URL de sucesso.
    
    ```jsx
    preference.create({
      body: {
        items: [
          {
            quantity: req.body.quantity,
            unit_price: req.body.price,
            description: req.body.description,
          },
        ],
        purpose: "wallet_purchase",  // Tipo de compra
        back_urls: {
          success: "http://localhost:3000/success", // URL de sucesso
          failure: "http://localhost:3000/failure", // URL de falha
          pending: "http://localhost:3000/pending", // URL pendente
        },
        auto_return: "approved",  // Retorno automático para o sucesso
      },
    })
      .then((response) => {
        console.log(response);
        res.json({ preferenceId: response.id, response });
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error creating preference');
      });
    
    ```
    
3. Reposta para o Frontend
    
    O `ID da preferência` gerado pelo Mercado Pago é retornado ao frontend para que o checkout seja iniciado.
    

### 7.4. Rota para Processar o Pagamento

Essa rota é chamada quando o pagamento é submetido no frontend. O objetivo é processar o pagamento com base nas informações fornecidas.

1. Receber os Dados de Pagamento
    
    O frontend envia os dados de pagamento (como método de pagamento, cartão de crédito, etc.)
    
    ```jsx
    app.post('/process_payment', (req, res) => {
      payment.create({ body: req.body })  // Cria o pagamento com base nos dados
    ```
    
2. Processar o Pagamento
    
    O método `payment.create` é utilizado para criar o pagamento no Mercado Pago. O Mercado Pago retorna a respota que contém como o status do pagamento.
    
    ```jsx
      .then((response) => {
        console.log(response);
        res.json(response);  // Retorna a resposta do pagamento
      })
      .catch(console.log);  // Caso ocorra erro
    ```
    

## 8. Conclusão

- Rota `/create_preference`: Cria uma preferência de pagamento no Mercado Pago e retorna o `preferencedId` para o frontend.
- Rota `/process_payment`: Processa o pagamento com base nos dados recebidos do frontend, como o método de pagamento selecionado.