// Configurações MQTT
const brokerUrl = 'ws://broker.hivemq.com:8000/mqtt';
const topicStatus = 'SENAI/G88407/status';
const topicControl = 'SENAI/G88407/control';
const topicStatuscontrol = 'SENAI/G88407/statuscontrol';
const client = mqtt.connect(brokerUrl);
const notification = document.getElementById('notification');

// Dados para o gráfico
const dadosTemperatura = {
    labels: [], // Inicialmente vazio, será preenchido com os horários
    datasets: [{
        label: 'Temperatura (°C)',
        data: [], // Inicialmente vazio, será preenchido com os dados de temperatura
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
    }]
};

// Configuração do gráfico
const configGraficoTemperatura = {
    type: 'line',
    data: dadosTemperatura,
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
};

// Criar gráfico
const graficoTemperatura = new Chart(
    document.getElementById('graficoTemperatura'),
    configGraficoTemperatura
);

// Conectar ao broker MQTT
client.on('connect', () => {
    console.log('Conectado ao broker MQTT');
    showNotification('Conectado ao broker MQTT', 'success');
    client.subscribe(topicStatus, () => {
        console.log('Inscrito no tópico de status');
    });
    client.subscribe(topicStatuscontrol, () => {
        console.log('Inscrito no tópico de status da bomba');
    });
});

// Função para enviar a mensagem MQTT para controlar a bomba
function sendMqttMessage(message) {
    client.publish(topicControl, message);
    showNotification(`Mensagem enviada: ${message}`, 'success');
}

// Função para exibir notificação
function showNotification(message, type) {
    notification.innerText = message;
    notification.className = `notification ${type === 'error' ? 'error' : 'success'}`;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000); // Ocultar a notificação após 3 segundos
}

// Função para receber e exibir os dados do status da estufa
client.on('message', (topic, message) => {
    if (topic === topicStatus) {
        // Supondo que os dados sejam recebidos em formato JSON
        const data = JSON.parse(message.toString());
        const temperatura = data.temperature || 'N/A';
        const umidadeAr = data.humidity || 'N/A';
        const umidadeSolo = data.soilMoisture || 'N/A';
        const agora = new Date().toLocaleTimeString();

        document.getElementById('temperatura').textContent = temperatura;
        document.getElementById('umidadeAr').textContent = umidadeAr;
        document.getElementById('umidadeSolo').textContent = umidadeSolo;
        document.getElementById('dataHora').textContent = agora;

        // Atualizar gráfico com os dados recebidos
        dadosTemperatura.labels.push(agora);
        dadosTemperatura.datasets[0].data.push(temperatura);
        graficoTemperatura.update();
    }

    if (topic === topicStatuscontrol) {
        // Atualiza o status da bomba conforme o comando recebido
        const statusBomba = message.toString().toUpperCase();
        document.getElementById('statusBomba').innerText = statusBomba === 'ON' ? 'Bomba Ligada' : 'Bomba Desligada';
    }
});