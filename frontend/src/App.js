import { Payment, initMercadoPago, StatusScreen } from '@mercadopago/sdk-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

initMercadoPago('TEST-185fe705-e3bf-4d3b-9726-de67b689e0f5', {
  locale: 'pt-BR'
});

const App = () => {
  const [preferenceId, setPreferenceId] = useState('');
  const [paymentId, setPaymentId] = useState(null); // Estado para armazenar o paymentId

  // Como se fosse um carrinho
  const productDataUpdated = {
    description: "Macbook air",
    quantity: 1,
    price: 1200,  
  }

  useEffect(() => {
    // Buscar o preferenceId no servidor para usar no statusScreen e mostra o status do pagamento
    const getPreferenceId = async () => {
      try {

        const response = await axios.post('http://localhost:5000/create_preference', productDataUpdated, {
          headers: {
            "Content-type": "application/json"
          }
        });

        console.log('Preferência criada:', response.data);
        setPreferenceId(response.data.preferenceId); // Armazenar o preferenceId no estado
      } catch (error) {
        console.error("Erro ao criar preferência:", error);
      }
    };

    getPreferenceId();
  }, []);

  const initialization = {
    amount: productDataUpdated.price, // Defina o valor do pagamento aqui
    preferenceId: preferenceId,
};

  const customization = {
    paymentMethods: {
      ticket: "all",
      bankTransfer: "all",
      creditCard: "all",
      debitCard: "all",
      mercadoPago: "all",
    },
    autoReturn: "approved", // Para redirecionar automaticamente se o pagamento for aprovado
    back_urls: {
      success: "http://localhost:3000/success", // URL para pagamento aprovado
      failure: "http://localhost:3000/failure", // URL para pagamento falhado
      pending: "http://localhost:3000/pending", // URL para pagamento pendente
    },
    visual: {
      showExternalReference: true,
      hideStatusDetails: true,
      hideTransactionDate: true,
      style: {
        theme: 'default', // 'default' | 'dark' | 'bootstrap' | 'flat'
      },
    },
  };

  const onSubmit = async ({ selectedPaymentMethod, formData }) => {
  // Adicionar descrição ao formData
  const formDataUpd = {
    ...formData,
    description: productDataUpdated.description, // Inclui a descrição do produto
  };

    try {
      const response = await axios.post("http://localhost:5000/process_payment", formDataUpd, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Resultado do pagamento', response.data.status);
      setPaymentId(response.data.id); // Armazenar o paymentId retornado pela API
      return response.data; // Aqui, você pode tratar o resultado do pagamento
    } catch (error) {
      console.error('Erro ao processar o pagamento:', error);
      throw error;
    }
  };
  
  console.log(paymentId)

  const onError = async (error) => {
    console.error('Erro na integração do MercadoPago:', error);
  };

  const onReady = async () => {
    // Callback quando o MercadoPago estiver pronto. Pode esconder carregamentos, por exemplo.
  };

  return (
    <>
      <Payment
        initialization={initialization}
        customization={customization}
        onSubmit={onSubmit}
        onReady={onReady}
        onError={onError}
      />
      {paymentId && (
        <StatusScreen initialization={{ paymentId }} customization={customization} /> // Exibe a tela de status apenas quando o paymentId for disponível
      )}
    </>
  );
};

export default App;
