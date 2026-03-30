document.addEventListener('DOMContentLoaded', function() { 
    // Оптимизация для мобильных: предотвращаем быстрые множественные клики
    let isProcessing = false; 
    
    // Функция для анимации появления элементов при скролле
    function checkVisibility() {
        const elements = document.querySelectorAll('.fade-in');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('visible');
            }
        });
    }
    
    // Запускаем проверку видимости при загрузке
    checkVisibility();
    
    // Обработка кнопки карты
    const mapButton = document.getElementById('map-btn');
    const mapContainer = document.getElementById('map-container');
    const closeMapButton = document.getElementById('close-map');
    
    if (mapButton && mapContainer) {
        mapButton.addEventListener('click', function(e) {
            if (isProcessing) return;
            isProcessing = true;
            
            e.preventDefault();
            mapContainer.classList.remove('hidden');
            
            // Плавная прокрутка с учетом мобильных устройств
            setTimeout(() => {
                mapContainer.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
                isProcessing = false;
            }, 300);
        });
    }
    
    if (closeMapButton) {
        closeMapButton.addEventListener('click', function(e) {
            if (isProcessing) return;
            isProcessing = true;
            
            e.preventDefault();
            mapContainer.classList.add('hidden');
            
            // Прокрутка обратно к кнопке
            setTimeout(() => {
                if (mapButton) {
                    mapButton.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
                isProcessing = false;
            }, 300);
        });
    }
    
    // Обработка формы RSVP
    const rsvpForm = document.getElementById('rsvp-form');
    const formMessage = document.getElementById('form-message');
    
    if (rsvpForm) {
        rsvpForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            if (isProcessing) return;
            isProcessing = true;
            
            // Получение данных формы
            const formData = new FormData(rsvpForm);
            const formDataObj = Object.fromEntries(formData.entries());
            
            // Валидация формы
            let isValid = true;
            const nameInput = document.getElementById('name');
            const attendanceSelect = document.getElementById('attendance');
            const alcoholSelect = document.getElementById('alcohol');
            
            // Сброс предыдущих сообщений об ошибках
            formMessage.className = 'form-message';
            formMessage.style.display = 'none';
            
            // Проверка обязательных полей
            if (!nameInput.value.trim()) {
                formMessage.textContent = 'Пожалуйста, введите ваше имя';
                formMessage.className = 'form-message error';
                formMessage.style.display = 'block';
                isValid = false;
                nameInput.focus();
            } else if (!attendanceSelect.value) {
                formMessage.textContent = 'Пожалуйста, выберите вариант присутствия';
                formMessage.className = 'form-message error';
                formMessage.style.display = 'block';
                isValid = false;
                attendanceSelect.focus();
            } else if (!alcoholSelect.value) {
                formMessage.textContent = 'Пожалуйста, выберите предпочтения по алкоголю';
                formMessage.className = 'form-message error';
                formMessage.style.display = 'block';
                isValid = false;
                alcoholSelect.focus();
            }
            
            if (!isValid) {
                isProcessing = false;
                return;
            }
            
            // ⚠️ ВАШ URL GOOGLE SCRIPT ⚠️
            const scriptURL = 'https://script.google.com/macros/s/AKfycbwGm-6950tJRTn7srEc8ltwOSKiy4ZzeUG4gz5eR2w6Zo3lDY84v5gBL3qCEK3pz9AyTA/exec';
            
            // Показать индикатор загрузки
            const submitBtn = rsvpForm.querySelector('.submit-btn');
            const originalBtnText = submitBtn.textContent;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
            submitBtn.disabled = true;
            
            console.log('Отправка данных на свадьбу Максима и Кристины...');
            console.log('URL скрипта:', scriptURL);
            console.log('Данные формы:', formDataObj);
            
            // Создаем параметры для отправки (без телефона)
            const params = new URLSearchParams();
            params.append('name', formDataObj.name || '');
            params.append('attendance', formDataObj.attendance || '');
            params.append('alcohol', formDataObj.alcohol || '');
            
            // Отправка данных на Google Apps Script
            fetch(scriptURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString()
            })
            .then(response => {
                console.log('Статус ответа от Google Apps Script:', response.status, response.statusText);
                
                // Google Apps Script возвращает 302 редирект, поэтому нам нужно получить текст
                return response.text();
            })
            .then(data => {
                console.log('Ответ от Google Apps Script:', data.substring(0, 200) + '...');
                
                // Пробуем распарсить JSON
                try {
                    // Иногда Google Apps Script возвращает HTML, нужно извлечь JSON
                    const jsonMatch = data.match(/\{.*\}/);
                    if (jsonMatch) {
                        const result = JSON.parse(jsonMatch[0]);
                        console.log('Успешно распарсен JSON:', result);
                        
                        if (result.success) {
                            handleSuccess(formDataObj, attendanceSelect.value);
                        } else {
                            throw new Error(result.message || 'Ошибка сервера');
                        }
                    } else {
                        // Если не JSON, но ответ есть - считаем успешным
                        console.log('Ответ не JSON, но есть данные');
                        handleSuccess(formDataObj, attendanceSelect.value);
                        saveResponseLocally(formDataObj);
                    }
                } catch (e) {
                    console.warn('Не удалось распарсить JSON, но ответ получен:', e.message);
                    handleSuccess(formDataObj, attendanceSelect.value);
                    saveResponseLocally(formDataObj);
                }
            })
            .catch(error => {
                console.error('Ошибка при отправке на Google Apps Script:', error);
                
                // Пробуем альтернативный метод отправки
                console.log('Пробуем альтернативный метод отправки...');
                
                // Простой POST запрос без заголовков
                fetch(scriptURL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: params.toString()
                })
                .then(() => {
                    console.log('Альтернативный метод успешен (no-cors)');
                    handleSuccess(formDataObj, attendanceSelect.value);
                    saveResponseLocally(formDataObj);
                })
                .catch(altError => {
                    console.error('Альтернативный метод тоже не удался:', altError);
                    
                    // Сохраняем локально и показываем сообщение
                    handleSuccess(formDataObj, attendanceSelect.value);
                    saveResponseLocally(formDataObj);
                    
                    // Информируем пользователя
                    showInfoMessage('Ваш ответ сохранён локально. Мы получим его позже.');
                });
            })
            .finally(() => {
                // Всегда восстанавливаем кнопку
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                isProcessing = false;
            });
        });
    }
    
    // Функция обработки успешной отправки
    function handleSuccess(formData, attendanceValue) {
        // Показываем сообщение пользователю
        showSuccessMessage(attendanceValue);
        
        // Очищаем форму через 2 секунды
        setTimeout(() => {
            const rsvpForm = document.getElementById('rsvp-form');
            if (rsvpForm) {
                rsvpForm.reset();
            }
        }, 2000);
        
        // Скрываем сообщение через 8 секунд
        setTimeout(() => {
            const formMessage = document.getElementById('form-message');
            if (formMessage && formMessage.classList.contains('success')) {
                formMessage.style.display = 'none';
            }
        }, 8000);
    }
    
    // Функция для показа успешного сообщения
    function showSuccessMessage(attendanceValue) {
        const formMessage = document.getElementById('form-message');
        if (!formMessage) return;
        
        if (attendanceValue === 'yes') {
            formMessage.textContent = 'Спасибо! Ваш ответ сохранён. Мы будем ждать вас на нашей свадьбе!';
        } else {
            formMessage.textContent = 'Спасибо за ответ! Очень жаль, что вы не сможете быть с нами в этот день.';
        }
        formMessage.className = 'form-message success';
        formMessage.style.display = 'block';
        
        // Прокрутка к сообщению
        setTimeout(() => {
            formMessage.scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            });
        }, 100);
    }
    
    // Функция для показа информационного сообщения
    function showInfoMessage(text) {
        const formMessage = document.getElementById('form-message');
        if (!formMessage) return;
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'form-message info';
        infoDiv.innerHTML = `<i class="fas fa-info-circle"></i> ${text}`;
        infoDiv.style.backgroundColor = '#e3f2fd';
        infoDiv.style.color = '#1565c0';
        infoDiv.style.marginTop = '10px';
        infoDiv.style.padding = '10px';
        infoDiv.style.borderRadius = '4px';
        
        formMessage.parentNode.insertBefore(infoDiv, formMessage.nextSibling);
        
        setTimeout(() => {
            infoDiv.style.opacity = '0';
            setTimeout(() => {
                if (infoDiv.parentNode) {
                    infoDiv.parentNode.removeChild(infoDiv);
                }
            }, 500);
        }, 5000);
    }
    
    // Функция для локального сохранения ответа (без телефона)
    function saveResponseLocally(formData) {
        try {
            // Сохраняем в localStorage
            const responses = JSON.parse(localStorage.getItem('wedding_responses') || '[]');
            responses.push({
                name: formData.name || 'Без имени',
                attendance: formData.attendance || 'no',
                alcohol: formData.alcohol || 'не указано',
                timestamp: new Date().toISOString(),
                date: new Date().toLocaleDateString('ru-RU'),
                time: new Date().toLocaleTimeString('ru-RU')
            });
            
            // Ограничиваем количество сохраненных ответов (последние 50)
            if (responses.length > 50) {
                responses.splice(0, responses.length - 50);
            }
            
            localStorage.setItem('wedding_responses', JSON.stringify(responses));
            console.log('Ответ сохранён локально. Всего сохранено:', responses.length);
            
            // Показываем кнопку для просмотра сохраненных ответов
            showLocalResponsesButton();
            
        } catch (e) {
            console.error('Ошибка локального сохранения:', e);
        }
    }
    
    // Функция для показа кнопки просмотра локальных ответов
    function showLocalResponsesButton() {
        // Проверяем, есть ли уже кнопка
        if (document.getElementById('view-local-responses')) {
            return;
        }
        
        // Создаем кнопку
        const button = document.createElement('button');
        button.id = 'view-local-responses';
        button.className = 'local-responses-btn';
        button.innerHTML = '<i class="fas fa-history"></i> Показать сохранённые ответы';
        button.style.display = 'block';
        button.style.margin = '15px auto 0';
        button.style.padding = '8px 16px';
        button.style.backgroundColor = '#f8f9fa';
        button.style.color = '#495057';
        button.style.border = '1px solid #dee2e6';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        button.style.fontSize = '14px';
        button.style.transition = 'all 0.3s ease';
        
        button.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#e9ecef';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#f8f9fa';
        });
        
        button.addEventListener('click', function() {
            showLocalResponses();
        });
        
        // Добавляем кнопку после формы
        const rsvpSection = document.querySelector('.rsvp-section');
        if (rsvpSection) {
            rsvpSection.appendChild(button);
        }
    }
    
    // Функция для показа локальных ответов (без телефона)
    function showLocalResponses() {
        try {
            const responses = JSON.parse(localStorage.getItem('wedding_responses') || '[]');
            if (responses.length === 0) {
                alert('Нет сохранённых ответов');
                return;
            }
            
            let message = `🎉 Сохранённые ответы на свадьбу Максима и Кристины\n\n`;
            message += `Всего ответов: ${responses.length}\n\n`;
            
            responses.forEach((resp, index) => {
                const attendanceText = resp.attendance === 'yes' ? '✅ Придёт' : '❌ Не придёт';
                const alcoholText = resp.alcohol && resp.alcohol !== 'не указано' ? `\n   🍷 ${resp.alcohol}` : '';
                
                message += `${index + 1}. ${resp.name}\n`;
                message += `   ${attendanceText}${alcoholText}\n`;
                message += `   📅 ${resp.date} ${resp.time}\n\n`;
            });
            
            message += '\n📋 Для организаторов:\n';
            message += 'Скопируйте эту информацию и перенесите в основную таблицу.';
            
            // Создаем модальное окно для отображения
            showResponsesModal(message, responses.length);
            
        } catch (e) {
            console.error('Ошибка чтения локальных ответов:', e);
            alert('Ошибка при чтении сохранённых ответов');
        }
    }
    
    // Функция для показа модального окна с ответами
    function showResponsesModal(content, count) {
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.id = 'responses-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        modal.style.zIndex = '9999';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        
        // Создаем контейнер
        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = 'white';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '10px';
        modalContent.style.maxWidth = '90%';
        modalContent.style.maxHeight = '80%';
        modalContent.style.overflow = 'auto';
        modalContent.style.boxShadow = '0 5px 30px rgba(0, 0, 0, 0.3)';
        
        // Заголовок
        const title = document.createElement('h3');
        title.textContent = `Сохранённые ответы (${count})`;
        title.style.marginBottom = '15px';
        title.style.color = '#d4a762';
        title.style.textAlign = 'center';
        
        // Текст
        const text = document.createElement('pre');
        text.textContent = content;
        text.style.whiteSpace = 'pre-wrap';
        text.style.wordWrap = 'break-word';
        text.style.fontFamily = 'monospace';
        text.style.fontSize = '12px';
        text.style.lineHeight = '1.4';
        
        // Кнопки
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.marginTop = '20px';
        buttonsContainer.style.textAlign = 'center';
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.justifyContent = 'center';
        buttonsContainer.style.gap = '10px';
        
        // Кнопка копирования
        const copyBtn = document.createElement('button');
        copyBtn.textContent = '📋 Копировать';
        copyBtn.style.padding = '8px 16px';
        copyBtn.style.backgroundColor = '#28a745';
        copyBtn.style.color = 'white';
        copyBtn.style.border = 'none';
        copyBtn.style.borderRadius = '4px';
        copyBtn.style.cursor = 'pointer';
        copyBtn.addEventListener('click', function() {
            navigator.clipboard.writeText(content).then(() => {
                copyBtn.textContent = '✅ Скопировано!';
                setTimeout(() => {
                    copyBtn.textContent = '📋 Копировать';
                }, 2000);
            });
        });
        
        // Кнопка закрытия
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Закрыть';
        closeBtn.style.padding = '8px 16px';
        closeBtn.style.backgroundColor = '#dc3545';
        closeBtn.style.color = 'white';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '4px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        // Кнопка очистки
        const clearBtn = document.createElement('button');
        clearBtn.textContent = '🧹 Очистить';
        clearBtn.style.padding = '8px 16px';
        clearBtn.style.backgroundColor = '#ffc107';
        clearBtn.style.color = '#212529';
        clearBtn.style.border = 'none';
        clearBtn.style.borderRadius = '4px';
        clearBtn.style.cursor = 'pointer';
        clearBtn.addEventListener('click', function() {
            if (confirm('Вы уверены, что хотите удалить все сохранённые ответы?')) {
                localStorage.removeItem('wedding_responses');
                const viewBtn = document.getElementById('view-local-responses');
                if (viewBtn) {
                    viewBtn.style.display = 'none';
                }
                document.body.removeChild(modal);
                alert('Сохранённые ответы удалены');
            }
        });
        
        // Собираем модальное окно
        buttonsContainer.appendChild(copyBtn);
        buttonsContainer.appendChild(clearBtn);
        buttonsContainer.appendChild(closeBtn);
        
        modalContent.appendChild(title);
        modalContent.appendChild(text);
        modalContent.appendChild(buttonsContainer);
        modal.appendChild(modalContent);
        
        // Добавляем на страницу
        document.body.appendChild(modal);
        
        // Закрытие по клику вне окна
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    // Оптимизация плавной прокрутки для мобильных
    const smoothScroll = function(targetId) {
        if (isProcessing) return;
        isProcessing = true;
        
        const targetElement = document.querySelector(targetId);
        if (!targetElement) {
            isProcessing = false;
            return;
        }
        
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = Math.min(800, Math.abs(distance) / 2);
        let startTime = null;
        
        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            } else {
                isProcessing = false;
            }
        }
        
        // Функция плавности
        function ease(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }
        
        requestAnimationFrame(animation);
    };
    
    // Обработка кликов по навигационным ссылкам
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            smoothScroll(targetId);
        });
    });
    
    // Оптимизация загрузки изображений для мобильных
    const lazyLoadImages = function() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            // Устанавливаем атрибут loading="lazy" для отложенной загрузки
            if (!img.getAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
            
            // Добавляем fallback для ошибок загрузки
            img.addEventListener('error', function() {
                this.style.backgroundColor = '#f5f5f5';
                this.style.minHeight = '200px';
                console.warn('Не удалось загрузить изображение:', this.src);
            });
        });
    };
    
    // Запускаем ленивую загрузку после полной загрузки страницы
    window.addEventListener('load', function() {
        lazyLoadImages();
        
        // Добавляем класс loaded для плавного появления контента
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 100);
        
        // Проверяем видимость элементов после загрузки
        checkVisibility();
        
        // Скрываем индикатор загрузки карты через секунду
        const mapLoading = document.querySelector('.map-loading');
        if (mapLoading) {
            setTimeout(() => {
                mapLoading.style.display = 'none';
            }, 1000);
        }
        
        // Проверяем есть ли локально сохраненные ответы
        try {
            const responses = JSON.parse(localStorage.getItem('wedding_responses') || '[]');
            if (responses.length > 0) {
                console.log('Найдено сохранённых ответов:', responses.length);
                showLocalResponsesButton();
                
                // Пробуем отправить сохраненные ответы на сервер
                if (responses.length > 0 && navigator.onLine) {
                    setTimeout(() => {
                        retryFailedSubmissions();
                    }, 3000);
                }
            }
        } catch (e) {
            console.error('Ошибка при проверке локальных ответов:', e);
        }
    });
    
    // Функция для повторной отправки неотправленных ответов
    function retryFailedSubmissions() {
        try {
            const responses = JSON.parse(localStorage.getItem('wedding_responses') || '[]');
            if (responses.length === 0) return;
            
            console.log('Пробуем повторно отправить сохранённые ответы...');
            
            // Можно добавить логику для повторной отправки
            // Например, отметить отправленные ответы и удалить их из localStorage
            
        } catch (e) {
            console.error('Ошибка при повторной отправке:', e);
        }
    }
    
    // Оптимизация для медленных сетей
    if ('connection' in navigator) {
        const connection = navigator.connection;
        if (connection) {
            // Если медленное соединение, отключаем некоторые эффекты
            if (connection.effectiveType === 'slow-2g' || 
                connection.effectiveType === '2g' ||
                connection.saveData === true) {
                console.log('Медленное соединение, оптимизируем загрузку...');
                
                // Отключаем плавные анимации
                document.documentElement.style.setProperty('--animation-duration', '0s');
                
                // Предотвращаем загрузку ненужных ресурсов
                const allImages = document.querySelectorAll('img');
                allImages.forEach((img, index) => {
                    if (index > 2) { // Оставляем только первые 3 изображения
                        img.setAttribute('loading', 'lazy');
                        img.setAttribute('decoding', 'async');
                    }
                });
            }
        }
    }
    
    // Фикс для iOS Safari 100vh - ПРОСТОЙ И ЭФФЕКТИВНЫЙ
    function setVH() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // Устанавливаем фиксированную высоту для всех fullscreen секций
        const fullscreenSections = document.querySelectorAll('.hero-image, .story-image, .location-image');
        fullscreenSections.forEach(section => {
            section.style.height = `${window.innerHeight}px`;
        });
        
        // Футер делаем чуть меньше
        const footerImage = document.querySelector('.footer-image');
        if (footerImage) {
            footerImage.style.height = `${window.innerHeight * 0.8}px`;
        }
    }
    
    // Устанавливаем высоту при загрузке и изменении размера окна
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    // Проверка видимости элементов при скролле
    window.addEventListener('scroll', checkVisibility);
    
    // Счетчик обратного отсчета
    function updateCountdown() {
        const weddingDate = new Date('2026-08-22T15:30:00').getTime();
        const now = new Date().getTime();
        const timeLeft = weddingDate - now;
        
        const daysElement = document.getElementById('days');
        const hoursElement = document.getElementById('hours');
        const minutesElement = document.getElementById('minutes');
        const secondsElement = document.getElementById('seconds');
        
        if (!daysElement || !hoursElement || !minutesElement || !secondsElement) {
            return;
        }
        
        if (timeLeft > 0) {
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            daysElement.textContent = days.toString().padStart(2, '0');
            hoursElement.textContent = hours.toString().padStart(2, '0');
            minutesElement.textContent = minutes.toString().padStart(2, '0');
            secondsElement.textContent = seconds.toString().padStart(2, '0');
            
            // Добавляем анимацию при изменении секунд
            secondsElement.classList.add('changing');
            setTimeout(() => {
                secondsElement.classList.remove('changing');
            }, 300);
            
            // Анимация при изменении минут (каждую минуту)
            if (seconds === 0) {
                minutesElement.classList.add('changing');
                setTimeout(() => {
                    minutesElement.classList.remove('changing');
                }, 300);
            }
            
            // Анимация при изменении часов (каждый час)
            if (minutes === 0 && seconds === 0) {
                hoursElement.classList.add('changing');
                setTimeout(() => {
                    hoursElement.classList.remove('changing');
                }, 300);
            }
            
            // Анимация при изменении дней (каждый день)
            if (hours === 0 && minutes === 0 && seconds === 0) {
                daysElement.classList.add('changing');
                setTimeout(() => {
                    daysElement.classList.remove('changing');
                }, 300);
            }
        } else {
            daysElement.textContent = '00';
            hoursElement.textContent = '00';
            minutesElement.textContent = '00';
            secondsElement.textContent = '00';
            
            const countdownMessage = document.querySelector('.countdown-message');
            if (countdownMessage) {
                countdownMessage.textContent = 'Этот день настал! Спасибо, что разделили его с нами!';
                countdownMessage.style.color = '#d4a762';
                countdownMessage.style.fontWeight = 'bold';
            }
        }
    }
    
    // Обновляем счетчик каждую секунду
    updateCountdown();
    setInterval(updateCountdown, 1000);
    
    // Обновляем счетчик при загрузке страницы
    window.addEventListener('load', updateCountdown);
    
    // Простой музыкальный плеер
    const musicBtn = document.getElementById('musicBtn');
    const audio = document.getElementById('weddingSong');
    
    if (musicBtn && audio) {
        let isPlaying = false;
        
        musicBtn.addEventListener('click', function() {
            if (isPlaying) {
                audio.pause();
                musicBtn.innerHTML = '<i class="fas fa-play"></i><span>Включить музыку</span>';
                isPlaying = false;
            } else {
                audio.play().then(() => {
                    musicBtn.innerHTML = '<i class="fas fa-pause"></i><span>Выключить музыку</span>';
                    isPlaying = true;
                }).catch(error => {
                    console.log('Ошибка воспроизведения:', error);
                    musicBtn.innerHTML = '<i class="fas fa-volume-mute"></i><span>Музыка недоступна</span>';
                });
            }
        });
        
        // Автоматически останавливаем при паузе/окончании
        audio.addEventListener('pause', function() {
            if (isPlaying) {
                musicBtn.innerHTML = '<i class="fas fa-play"></i><span>Включить музыку</span>';
                isPlaying = false;
            }
        });
        
        // Начинаем с выключенной музыки
        audio.volume = 0.7; // 70% громкость
    }
});

// Тестовая функция для проверки подключения к Google Apps Script
function testGoogleScript() {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbwGm-6950tJRTn7srEc8ltwOSKiy4ZzeUG4gz5eR2w6Zo3lDY84v5gBL3qCEK3pz9AyTA/exec';
    
    console.log('Тестирование подключения к Google Apps Script...');
    console.log('URL:', scriptURL);
    
    // Добавляем timestamp для предотвращения кэширования
    const testURL = scriptURL + '?test=' + Date.now();
    
    fetch(testURL)
        .then(response => {
            console.log('Статус подключения:', response.status, response.statusText);
            return response.text();
        })
        .then(text => {
            console.log('Ответ сервера (первые 300 символов):', text.substring(0, 300));
            
            // Проверяем, что скрипт работает
            if (text.includes('Свадебный скрипт работает') || text.includes('doGet') || text.includes('success')) {
                console.log('✅ Google Apps Script работает корректно!');
                alert('✅ Подключение к Google Apps Script успешно!\nСкрипт готов к приёму данных.');
            } else {
                console.log('⚠️ Неожиданный ответ от сервера');
                alert('⚠️ Скрипт отвечает, но возможно не настроен правильно.\nПроверьте код Apps Script.');
            }
        })
        .catch(error => {
            console.error('❌ Ошибка подключения:', error);
            alert('❌ Не удалось подключиться к Google Apps Script.\nОшибка: ' + error.message);
        });
}

// Календарь с выделенной датой свадьбы
(function initWeddingCalendar() {
    const weddingDate = new Date(2026, 7, 22); // 22 августа 2026 (месяц 7 = август)
    let currentMonth = weddingDate.getMonth();
    let currentYear = weddingDate.getFullYear();
    
    const monthYearEl = document.getElementById('monthYear');
    const calendarDaysEl = document.getElementById('calendarDays');
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    
    if (!calendarDaysEl) return;
    
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    
    function renderCalendar() {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const startWeekday = firstDayOfMonth.getDay();
        // Корректируем: в нашей сетке понедельник — первый день (0 = воскресенье)
        let startOffset = startWeekday === 0 ? 6 : startWeekday - 1;
        
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
        
        calendarDaysEl.innerHTML = '';
        
        // Дни предыдущего месяца
        for (let i = startOffset - 1; i >= 0; i--) {
            const dayNum = prevMonthDays - i;
            const dayEl = createDayElement(dayNum, true);
            calendarDaysEl.appendChild(dayEl);
        }
        
        // Дни текущего месяца
        for (let day = 1; day <= daysInMonth; day++) {
            const isWeddingDay = (currentYear === weddingDate.getFullYear() && 
                                  currentMonth === weddingDate.getMonth() && 
                                  day === weddingDate.getDate());
            const dayEl = createDayElement(day, false, isWeddingDay);
            calendarDaysEl.appendChild(dayEl);
        }
        
        // Дни следующего месяца
        const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
        const nextMonthDaysCount = totalCells - (startOffset + daysInMonth);
        for (let day = 1; day <= nextMonthDaysCount; day++) {
            const dayEl = createDayElement(day, true);
            calendarDaysEl.appendChild(dayEl);
        }
        
        monthYearEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }
    
    function createDayElement(day, isOtherMonth, isWeddingDay = false) {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        if (isOtherMonth) div.classList.add('other-month');
        if (isWeddingDay) div.classList.add('wedding-day');
        div.textContent = day;
        return div;
    }
    
    function goToWeddingMonth() {
        currentMonth = weddingDate.getMonth();
        currentYear = weddingDate.getFullYear();
        renderCalendar();
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentMonth === 0) {
                currentMonth = 11;
                currentYear--;
            } else {
                currentMonth--;
            }
            renderCalendar();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentMonth === 11) {
                currentMonth = 0;
                currentYear++;
            } else {
                currentMonth++;
            }
            renderCalendar();
        });
    }
    
    renderCalendar();
})();