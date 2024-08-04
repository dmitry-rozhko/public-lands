import { parseString } from 'xml2js';
import fetch from 'node-fetch';

const telegramToken = '7395231156:AAEK9Sv85tYEhCxtjj3Ij6g6IrTTeoudsOw';
const chatId = '-1002184394273';


async function getChatId() {
    try {
        const response = await fetch(`https://api.telegram.org/bot${telegramToken}/getUpdates`);
        const data = await response.json();

        console.log('Ответ от Telegram API:', JSON.stringify(data, null, 2));

        if (data.ok && data.result.length > 0) {
            data.result.forEach(update => {
                if (update.message && update.message.chat) {
                    console.log('chat_id:', update.message.chat.id);
                    console.log('chat title:', update.message.chat.title || 'Личный чат');
                }
            });
        } else {
            console.log('Нет новых обновлений.');
        }
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
    }
}

async function sendMessageToTelegram(message) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });

        const data = await response.json();
        if (!data.ok && data.error_code === 429) {
            console.log('Ошибка Too Many Requests, повторная попытка через', data.parameters.retry_after, 'секунд');
            // Ожидаем указанное количество секунд перед повторной попыткой
            await new Promise(resolve => setTimeout(resolve, data.parameters.retry_after * 1000));
            return sendMessageToTelegram(message); // Повторяем попытку отправки сообщения
        } else if (!data.ok) {
            console.error('Ошибка при отправке сообщения в Telegram:', data);
        } else {
            console.log('Сообщение успешно отправлено в Telegram:', data);
        }
    } catch (error) {
        console.error('Ошибка при отправке сообщения в Telegram:', error);
    }
}


function replaceBrWithNewline(text) {
    return text.replace(/<br\s*\/?>/gi, '\n');
}

export default async function handler(req, res) {
    const url = 'https://torgi.gov.ru/new/api/public/lotcards/rss?dynSubjRF=80,63&biddForm=EA,PA&chars=&lotStatus=PUBLISHED,APPLICATIONS_SUBMISSION&biddEndFrom=&biddEndTo=&pubFrom=&pubTo=&aucStartFrom=&aucStartTo=&catCode=301&text=&matchPhrase=false&amoOrgCode=&npa=&byFirstVersion=true';
    const url1 = 'https://torgi.gov.ru/new/api/public/lotcards/rss?dynSubjRF=63,80&biddType=ZK&biddForm=&currCode=&chars=&lotStatus=PUBLISHED,APPLICATIONS_SUBMISSION&biddEndFrom=&biddEndTo=&pubFrom=&pubTo=&aucStartFrom=&aucStartTo=&etpCode=&text=&matchPhrase=false&noticeStatus=&amoOrgCode=&npa=&byFirstVersion=true';

    try {
        const response = await fetch(url);
        const data = await response.text();

        parseString(data, async (err, result) => {
            if (err) {
                console.error('Ошибка при парсинге XML:', err);
                res.status(500).json({ message: 'Ошибка при парсинге данных' });
                return;
            }

            res.status(200).json(result);

            const items = result.rss.channel[0].item;
            const keywords = ['Таганрог', 'Неклиновский', 'Севастополь'];
            let count = 0;
            for (const item of items) {
                
                const title = replaceBrWithNewline(item.title[0]);
                const description = replaceBrWithNewline(item.description[0]);

                // Проверяем, содержит ли описание или название один из ключевых слов
                if (keywords.some(keyword => title.includes(keyword) || description.includes(keyword))) {
                    count++
                    const link = item.link[0];
                    const pubDate = item.pubDate[0];

                    const message = `
<b>${title}</b>\n
<a href="${link}">Ссылка</a>\n
<i>Описание:</i> ${description}\n
<i>Дата публикации:</i> ${pubDate}
                    `;

                await sendMessageToTelegram(message);
                }
            }

            console.log(`Отправлено ${count} сообщений в Telegram`);
        });
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        res.status(500).json({ message: 'Ошибка на стороне сервера' });
    }
}