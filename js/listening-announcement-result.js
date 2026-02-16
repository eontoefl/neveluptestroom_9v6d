// Listening - 공지사항 채점 화면 로직 (컨버와 동일)

// 결과 화면 표시
function showAnnouncementResults() {
    console.log('📊 [공지사항] 결과 화면 표시');
    
    const announcementResultsStr = sessionStorage.getItem('announcementResults');
    if (!announcementResultsStr) {
        console.error('❌ 결과 데이터가 없습니다');
        return;
    }
    
    const announcementResults = JSON.parse(announcementResultsStr);
    
    // 전체 정답/오답 계산
    let totalCorrect = 0;
    let totalQuestions = 0;
    
    announcementResults.forEach(setResult => {
        setResult.answers.forEach(answer => {
            totalQuestions++;
            if (answer.isCorrect) {
                totalCorrect++;
            }
        });
    });
    
    const totalIncorrect = totalQuestions - totalCorrect;
    const totalScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    
    console.log('📊 총 문제:', totalQuestions);
    console.log('✅ 정답:', totalCorrect);
    console.log('❌ 오답:', totalIncorrect);
    console.log('💯 점수:', totalScore + '%');
    
    // 결과 UI 업데이트
    document.getElementById('announcementResultScoreValue').textContent = totalScore + '%';
    document.getElementById('announcementResultCorrectCount').textContent = totalCorrect;
    document.getElementById('announcementResultIncorrectCount').textContent = totalIncorrect;
    document.getElementById('announcementResultTotalCount').textContent = totalQuestions;
    
    // Week/Day 정보
    const currentTest = JSON.parse(sessionStorage.getItem('currentTest') || '{"week":"Week 1","day":"월"}');
    const dayTitle = `${currentTest.week || 'Week 1'}, ${currentTest.day || '월'}요일 - 공지사항`;
    document.getElementById('announcementResultDayTitle').textContent = dayTitle;
    
    // 세부 결과 렌더링
    const detailsContainer = document.getElementById('announcementResultDetails');
    let detailsHTML = '';
    
    announcementResults.forEach((setResult, setIdx) => {
        detailsHTML += renderAnnouncementSetResult(setResult, setIdx);
    });
    
    detailsContainer.innerHTML = detailsHTML;
    
    // 결과 화면 표시
    showScreen('listeningAnnouncementResultScreen');
    
    // 오디오 리스너 초기화 (DOM 렌더링 후)
    setTimeout(() => {
        console.log('🔧 오디오 리스너 초기화 시작...');
        initAnnouncementResultAudioListeners();
        console.log('✅ 오디오 리스너 초기화 완료');
        
        // 툴팁 이벤트 리스너 추가
        const highlightedWords = document.querySelectorAll('.announcement-keyword-highlight');
        highlightedWords.forEach(word => {
            word.addEventListener('mouseenter', showAnnouncementTooltip);
            word.addEventListener('mouseleave', hideAnnouncementTooltip);
        });
        console.log(`✅ 툴팁 이벤트 리스너 추가 완료: ${highlightedWords.length}개`);
        
        // 초기화 후 결과 데이터 정리
        sessionStorage.removeItem('announcementResults');
    }, 500); // 300ms → 500ms로 증가
}

// 세트별 결과 렌더링
function renderAnnouncementSetResult(setResult, setIdx) {
    const audioId = `announcement-main-audio-${setIdx}`;
    
    let html = `
        <div class="result-set-section">
            <div class="result-section-title">
                <i class="fas fa-headphones"></i>
                <span>공지사항 결과</span>
            </div>
            
            <!-- 공지사항 오디오 섹션 (세트당 한 번만) -->
            ${setResult.answers[0].audioUrl ? `
            <div class="audio-section">
                <div class="audio-title">
                    <i class="fas fa-volume-up"></i>
                    <span>공지사항 오디오 다시 듣기</span>
                </div>
                <div class="audio-player-container">
                    <button class="audio-play-btn" onclick="toggleAnnouncementAudio('${audioId}')">
                        <i class="fas fa-play" id="${audioId}-icon"></i>
                    </button>
                    <div class="audio-seek-container">
                        <div class="audio-seek-bar" id="${audioId}-seek" onclick="seekAnnouncementAudio('${audioId}', event)">
                            <div class="audio-seek-progress" id="${audioId}-progress" style="width: 0%">
                                <div class="audio-seek-handle"></div>
                            </div>
                        </div>
                        <div class="audio-time">
                            <span id="${audioId}-current">0:00</span> / <span id="${audioId}-duration">0:00</span>
                        </div>
                    </div>
                    <audio id="${audioId}" src="${convertGoogleDriveUrl(setResult.answers[0].audioUrl)}"></audio>
                </div>
                ${setResult.answers[0].script ? renderAnnouncementScript(setResult.answers[0].script, setResult.answers[0].scriptTrans, setResult.answers[0].scriptHighlights || []) : ''}
            </div>
            ` : ''}
            
            <div class="questions-section">
    `;
    
    // 각 문제 렌더링
    setResult.answers.forEach((answer, qIdx) => {
        html += renderAnnouncementAnswer(answer, qIdx, setIdx);
    });
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

// 스크립트 렌더링 (컨버와 동일, 화자 구분 없음)
function renderAnnouncementScript(script, scriptTrans, scriptHighlights = []) {
    if (!script) return '';
    
    console.log('=== 스크립트 파싱 디버깅 ===');
    console.log('script:', script);
    console.log('scriptTrans:', scriptTrans);
    console.log('scriptHighlights:', scriptHighlights);
    
    // "Woman:" 제거
    let cleanScript = script.replace(/^Woman:\s*/i, '').trim();
    
    // 영어 스크립트를 문장 단위로 분리 (. 기준)
    const sentences = cleanScript.split(/(?<=[.!?])\s+/);
    
    // 한국어 번역도 문장 단위로 분리 (. 기준)
    const translations = scriptTrans ? scriptTrans.split(/(?<=[.!?])\s+/) : [];
    
    console.log('  → 영어 문장 수:', sentences.length);
    console.log('  → 한국어 번역 수:', translations.length);
    
    let html = '<div class="audio-script">';
    
    // 각 문장마다 영어 → 한국어 순서로 표시
    sentences.forEach((sentence, index) => {
        const translation = translations[index] || '';
        
        html += `
            <div class="script-turn">
                <div class="script-text">
                    ${highlightAnnouncementScript(sentence, scriptHighlights)}
                </div>
                ${translation ? `
                <div class="script-translation">
                    ${translation}
                </div>
                ` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// Script에 툴팁 추가 (Google Sheets의 scriptHighlights 사용)
function highlightAnnouncementScript(scriptText, highlights) {
    console.log('🎨 [highlightAnnouncementScript] 호출됨');
    console.log('  → scriptText:', scriptText.substring(0, 50) + '...');
    console.log('  → highlights:', highlights);
    console.log('  → highlights 타입:', typeof highlights);
    console.log('  → highlights 길이:', highlights ? highlights.length : 'null/undefined');
    
    if (!highlights || highlights.length === 0) {
        console.log('  ⚠️ highlights 없음 - 원본 텍스트 반환');
        return escapeHtml(scriptText);
    }
    
    let highlightedText = escapeHtml(scriptText);
    
    // 각 하이라이트 단어/구문에 대해 처리
    highlights.forEach((highlight, index) => {
        console.log(`  → 처리 중 [${index}]:`, highlight);
        
        const word = highlight.word || '';
        const translation = highlight.translation || '';
        const explanation = highlight.explanation || '';
        
        if (!word) {
            console.log(`    ⚠️ word 없음 - 건너뜀`);
            return;
        }
        
        // 단어/구문을 찾아서 하이라이트 추가
        const regex = new RegExp(`\\b(${escapeRegex(word)})\\b`, 'gi');
        const beforeReplace = highlightedText;
        highlightedText = highlightedText.replace(regex, (match) => {
            console.log(`    ✅ "${word}" 매칭됨!`);
            return `<span class="announcement-keyword-highlight" data-translation="${escapeHtml(translation)}" data-explanation="${escapeHtml(explanation)}">${match}</span>`;
        });
        
        if (beforeReplace === highlightedText) {
            console.log(`    ⚠️ "${word}" 매칭 실패`);
        }
    });
    
    console.log('  → 최종 결과:', highlightedText.substring(0, 100) + '...');
    return highlightedText;
}

// 문제별 답안 렌더링
function renderAnnouncementAnswer(answer, qIdx, setIdx) {
    const isCorrect = answer.isCorrect;
    const statusClass = isCorrect ? 'correct' : 'incorrect';
    const statusIcon = isCorrect ? 'fa-check-circle' : 'fa-times-circle';
    const statusText = isCorrect ? '정답' : '오답';
    
    // 옵션 A, B, C, D 레이블
    const optionLabels = ['A', 'B', 'C', 'D'];
    
    return `
        <div class="question-result ${statusClass}">
            <div class="question-header">
                <div class="question-number">
                    <i class="fas ${statusIcon}"></i>
                    <span>문제 ${answer.questionNum} - ${statusText}</span>
                </div>
            </div>
            
            <div class="question-content">
                <div class="question-text">${answer.question}</div>
                ${answer.questionTrans ? `<div class="question-translation">${answer.questionTrans}</div>` : ''}
            </div>
            
            <div class="answer-summary">
                <div class="answer-item ${answer.userAnswer === answer.correctAnswer ? 'correct' : 'wrong'}">
                    <strong>내 답변:</strong> 
                    <span>${answer.userAnswer ? optionLabels[answer.userAnswer - 1] : '미선택'}</span>
                </div>
                <div class="answer-item correct">
                    <strong>정답:</strong> 
                    <span>${optionLabels[answer.correctAnswer - 1]}</span>
                </div>
            </div>
            
            ${renderAnnouncementOptionsExplanation(answer)}
        </div>
    `;
}

// 선택지 설명 렌더링
function renderAnnouncementOptionsExplanation(answer) {
    const optionLabels = ['A', 'B', 'C', 'D'];
    
    let html = '<div class="options-explanation">';
    
    answer.options.forEach((option, idx) => {
        const isCorrect = (idx + 1) === answer.correctAnswer;
        const isUserChoice = (idx + 1) === answer.userAnswer;
        const optionClass = isCorrect ? 'correct-option' : (isUserChoice ? 'wrong-option' : '');
        const translation = answer.optionTranslations && answer.optionTranslations[idx] ? answer.optionTranslations[idx] : '';
        const explanation = answer.optionExplanations && answer.optionExplanations[idx] ? answer.optionExplanations[idx] : '';
        
        html += `
            <div class="option-item ${optionClass}">
                <div class="option-header">
                    <span class="option-label">${optionLabels[idx]}</span>
                    <span class="option-text">${option}</span>
                    ${isCorrect ? '<i class="fas fa-check-circle"></i>' : ''}
                    ${isUserChoice && !isCorrect ? '<i class="fas fa-times-circle"></i>' : ''}
                </div>
                ${translation ? `<div class="option-translation">${translation}</div>` : ''}
                ${explanation ? `<div class="option-explanation">${explanation}</div>` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// 툴팁 표시
function showAnnouncementTooltip(e) {
    const translation = e.target.dataset.translation;
    const explanation = e.target.dataset.explanation;
    
    if (!translation && !explanation) return;
    
    // 기존 툴팁 제거
    hideAnnouncementTooltip();
    
    // 툴팁 생성
    const tooltip = document.createElement('div');
    tooltip.className = 'announcement-tooltip';
    tooltip.innerHTML = `
        ${translation ? `<div class="tooltip-translation">${translation}</div>` : ''}
        ${explanation ? `<div class="tooltip-explanation">${explanation}</div>` : ''}
    `;
    
    document.body.appendChild(tooltip);
    
    // 위치 계산
    const rect = e.target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    let top = rect.top - tooltipRect.height - 10 + window.scrollY;
    
    // 화면 밖으로 나가지 않도록 조정
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.style.opacity = '1';
}

// 툴팁 숨기기
function hideAnnouncementTooltip() {
    const existingTooltips = document.querySelectorAll('.announcement-tooltip');
    existingTooltips.forEach(tooltip => tooltip.remove());
}

// 오디오 재생/일시정지
function toggleAnnouncementAudio(audioId) {
    const audio = document.getElementById(audioId);
    const icon = document.getElementById(`${audioId}-icon`);
    
    if (!audio) return;
    
    if (audio.paused) {
        // 모든 오디오 정지
        document.querySelectorAll('audio').forEach(a => {
            if (a.id !== audioId) {
                a.pause();
                const otherIcon = document.getElementById(`${a.id}-icon`);
                if (otherIcon) {
                    otherIcon.classList.remove('fa-pause');
                    otherIcon.classList.add('fa-play');
                }
            }
        });
        
        audio.play();
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
    } else {
        audio.pause();
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
    }
}

// 오디오 시크
function seekAnnouncementAudio(audioId, event) {
    const audio = document.getElementById(audioId);
    const seekBar = document.getElementById(`${audioId}-seek`);
    
    if (!audio || !seekBar) return;
    
    const rect = seekBar.getBoundingClientRect();
    const pos = (event.clientX - rect.left) / rect.width;
    audio.currentTime = pos * audio.duration;
}

// 오디오 이벤트 리스너 초기화
function initAnnouncementResultAudioListeners() {
    console.log('🎵 [오디오 리스너] 초기화 시작');
    const audios = document.querySelectorAll('audio[id^="announcement-main-audio-"]');
    console.log('🎵 [오디오 리스너] 발견된 오디오 개수:', audios.length);
    
    audios.forEach((audio, index) => {
        const audioId = audio.id;
        console.log(`🎵 [오디오 리스너 ${index}] 등록 중:`, audioId);
        
        const progressBar = document.getElementById(`${audioId}-progress`);
        const currentTimeSpan = document.getElementById(`${audioId}-current`);
        const durationSpan = document.getElementById(`${audioId}-duration`);
        
        console.log(`  → progressBar 존재:`, !!progressBar);
        console.log(`  → currentTimeSpan 존재:`, !!currentTimeSpan);
        console.log(`  → durationSpan 존재:`, !!durationSpan);
        
        // 재생 시간 업데이트
        audio.addEventListener('timeupdate', () => {
            if (audio.duration) {
                const progress = (audio.currentTime / audio.duration) * 100;
                if (progressBar) progressBar.style.width = progress + '%';
                if (currentTimeSpan) {
                    const formattedTime = formatTime(audio.currentTime);
                    currentTimeSpan.textContent = formattedTime;
                    console.log(`⏱️ [시간 업데이트] ${audioId}:`, formattedTime);
                }
            }
        });
        
        // 메타데이터 로드 (재생 시간 표시)
        audio.addEventListener('loadedmetadata', () => {
            console.log(`✅ [메타데이터 로드] ${audioId}, duration:`, audio.duration);
            if (durationSpan) durationSpan.textContent = formatTime(audio.duration);
        });
        
        // ⭐ 이미 로드된 경우 즉시 duration 표시
        if (audio.readyState >= 1 && audio.duration) {
            console.log(`✅ [즉시 duration 표시] ${audioId}, duration:`, audio.duration);
            if (durationSpan) durationSpan.textContent = formatTime(audio.duration);
        } else {
            console.log(`⏳ [메타데이터 대기 중] ${audioId}, readyState:`, audio.readyState);
            // duration이 없으면 강제로 로드 시도
            audio.load();
        }
        
        // 재생 시작
        audio.addEventListener('play', () => {
            console.log(`▶️ [재생 시작] ${audioId}`);
        });
        
        // 재생 종료
        audio.addEventListener('ended', () => {
            console.log(`⏹️ [재생 종료] ${audioId}`);
            const icon = document.getElementById(`${audioId}-icon`);
            if (icon) {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
            }
        });
        
        console.log(`✅ [오디오 리스너 ${index}] 등록 완료:`, audioId);
    });
    
    console.log('✅ [오디오 리스너] 초기화 완료');
}

// 시간 포맷팅
function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 정규표현식 이스케이프
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Google Drive URL 변환 (다운로드용)
function convertGoogleDriveUrl(url) {
    if (!url) return '';
    if (url.includes('/file/d/')) {
        const fileId = url.match(/\/file\/d\/([^/]+)/)[1];
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    return url;
}

// 스케줄로 돌아가기
function backToScheduleFromAnnouncementResult() {
    showScreen('scheduleScreen');
    
    // 학습 일정 초기화
    if (currentUser) {
        initScheduleScreen();
    }
}
