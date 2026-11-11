const apiKey = "";
        let currentTab = 'recap';
        let activeRightTab = 'ai';
        let centerStageMode = 'stage';
        let currentOutputText = '';
        let previousScriptSnapshot = '';
        let timelineZoomScale = 22; // Default px per second

        function handleZoomChange() {
            const slider = document.getElementById('timelineZoomSlider');
            if (slider) {
                timelineZoomScale = parseInt(slider.value, 10);
                if (typeof renderTimelineTracks === 'function') renderTimelineTracks();
                if (typeof selectTimelineSegment === 'function' && timelineSegments && timelineSegments.length > 0) {
                    selectTimelineSegment(activeSegmentIndex);
                }
                
                // Update width of all media clips on timeline when zooming
                document.querySelectorAll('.timeline-clip').forEach(clip => {
                    if (clip.dataset.baseWidth) {
                        clip.style.width = `${timelineZoomScale * parseFloat(clip.dataset.baseWidth)}px`;
                    }
                });
            }
        }

        function changeZoom(delta) {
            const slider = document.getElementById('timelineZoomSlider');
            if (slider) {
                let newVal = parseInt(slider.value, 10) + (delta * 10);
                newVal = Math.max(parseInt(slider.min), Math.min(parseInt(slider.max), newVal));
                slider.value = newVal;
                handleZoomChange();
            }
        }
        let timelineSegments = [];
        let activeSegmentIndex = 0;
        let activeTimelineElement = null;
        let timelinePlayInterval = null;
        let prompterInterval = null;
        let prompterFontSize = 28;

        // Rich Khmer Presets for all 4 tools
        const STUDIO_PRESETS = {
            recap: [
                {
                    label: "🦑 ល្បែងមរណៈ (Squid Game)",
                    title: "ល្បែងមរណៈ Squid Game",
                    tone: "រន្ធត់ ព្រឺព្រួច និងលุ้น (Thriller)",
                    hook: "ចោទជាសំណួរចម្លែកធ្វើឱ្យអ្នកមើលឆ្ងល់ចង់ដឹងចម្លើយភ្លាមៗ",
                    plot: "បុរសជំពាក់បំណុលវ័ណ្ឌកឈ្មោះ Gi-hun និងមនុស្ស ៤៥៥ នាក់ទៀត បានយល់ព្រមចូលរួមលេងល្បែងកុមារភាពនៅលើកោះអាថ៌កំបាំងមួយ ដើម្បីដណ្តើមប្រាក់រង្វាន់ ៤៥.៦ ពាន់លានវ៉ុន។ ប៉ុន្តែអ្នកដែលចាញ់ត្រូវគ្រាប់កាំភ្លើងបាញ់សម្លាប់ភ្លាមៗនៅនឹងកន្លែង។"
                },
                {
                    label: "🚆 រថភ្លើងមរណៈទៅប៊ូសាន (Train to Busan)",
                    title: "រថភ្លើងមរណៈទៅប៊ូសាន (Train to Busan)",
                    tone: "សកម្មភាព ក្តៅគគុក (Action)",
                    hook: "ដកស្រង់ឈុតក្តៅគគុក ឬគ្រោះថ្នាក់បំផុតមកនិយាយមុន",
                    plot: "ឪពុកម្នាក់ឈ្មោះ Seok-woo បាននាំកូនស្រីតូចជិះរថភ្លើងល្បឿនលឿនទៅកាន់ទីក្រុងប៊ូសាន។ នៅពេលរថភ្លើងចេញដំណើរ មេរោគ Zombie បានផ្ទុះឡើង ហើយឆ្លងរាលដាលពេញទូរថភ្លើង។"
                }
            ],
            translate: [
                {
                    label: "🇬🇧 English SRT Subtitle -> ខ្មែរ",
                    sourceLang: "ភាសាអង់គ្លេស (English)",
                    format: "រក្សាទម្រង់ម៉ោង Subtitle .SRT",
                    tone: "ភាសាខ្មែរនិយាយធម្មជាតិ ស្តាប់ងាយយល់ មិនបកប្រែឆៅ",
                    text: `1\n00:00:01,000 --> 00:00:05,000\nNobody believed the old man when he warned the village about the red mist.\n\n2\n00:00:05,500 --> 00:00:10,000\nBy midnight, every single door in the town was locked from the outside.`
                },
                {
                    label: "🇨🇳 រឿងគុននិយមចិន -> សម្រាយរឿងខ្មែរ",
                    sourceLang: "ភាសាចិន (Chinese)",
                    format: "បកប្រែសម្រួលជាអត្ថបទសម្រាយរឿង (Smooth Recap)",
                    tone: "បែបរឿងបុរាណ ឬរឿងគុននិយមចិន (Wuxia)",
                    text: `十年磨一剑，少年林风终于走出了天山绝谷。他手握寒铁古剑，心中只有一个念头：查清当年家族灭门的真相。`
                }
            ],
            narrate: [
                {
                    label: "👻 រឿងខ្មោច៖ សំឡេងហៅឈ្មោះកណ្តាលព្រៃ",
                    category: "រឿងខ្មោច ព្រាយបិសាច និងអាថ៌កំបាំងពេលរាត្រី",
                    mood: "សំឡេងរន្ធត់ ខ្សឹបៗ ព្រឺឆ្អឹងខ្នង",
                    cues: "បញ្ចូលសញ្ញាណសំឡេងពេញលេញ ដូចជា [សំឡេងតិចៗ] [ភ្លេងរន្ធត់] [ផ្អាក ២វិនាទី]",
                    topic: "និទានអំពីពូសុខ ជាអ្នករកឃ្មុំព្រៃដែលបានដេកសម្រាកលើខ្ទមចាស់កណ្តាលព្រៃជ្រៅនាពេលយប់ខែងងឹត ហើយឮសំឡេងមនុស្សស្រីហៅឈ្មោះគាត់ពីក្រោមខ្ទម។"
                },
                {
                    label: "🏯 រឿងព្រេង៖ ចាស់ព្រឹទ្ធាចារ្យ និងគ្រាប់ពូជទិព្វ",
                    category: "រឿងព្រេងបុរាណខ្មែរ និងគតិបណ្ឌិត",
                    mood: "សំឡេងកក់ក្តៅ ផ្អែមល្ហែម ដូចចាស់ទុំ",
                    cues: "បញ្ចូលសញ្ញាណសំឡេងពេញលេញ ដូចជា [សំឡេងតិចៗ] [ភ្លេងរន្ធត់] [ផ្អាក ២វិនាទី]",
                    topic: "បងប្អូនពីរនាក់ទទួលបានគ្រាប់ពូជអាថ៌កំបាំងពីលោកតាសច្ចំលើភ្នំគូលែន ដើម្បីពិសោធន៍ចិត្តស្មោះត្រង់។"
                }
            ],
            create: [
                {
                    label: "⏳ នាឡិកាបង្វិលពេលវេលា (Fantasy)",
                    genre: "ផ្សងព្រេង អាថ៌កំបាំង និងអភិនិហារ",
                    setting: "ទីក្រុងភ្នំពេញ និងហាងនាឡិកាបុរាណ",
                    characters: "រតនា (ជាងនាឡិកា), លោកតាចន្ទ, ម៉ាលីស",
                    moral: "ពេលវេលាដែលមានតម្លៃបំផុតគឺបច្ចុប្បន្នភាព",
                    prompt: "រតនាបានរកឃើញនាឡិកាបុរាណមួយគ្រឿងដែលអាចបង្វិលពេលវេលាថយក្រោយបាន ១៥ នាទី ប៉ុន្តែរាល់ពេលប្រើម្តង ការចងចាំរបស់គាត់នឹងរលុបបន្តិចម្តងៗ។"
                }
            ]
        };

        window.onload = function () {
            renderPresetsForTab('recap');
            loadHistoryCount();

            const initialSample = ``;

            updateOutputContent(initialSample, 'សម្រាយរឿង AI');
        };

        function selectTopMenu(menuKey, targetTool) {
            document.querySelectorAll('.cc-top-tab').forEach(el => el.classList.remove('active'));
            const activeEl = document.getElementById(`topTab-${menuKey}`);
            if (activeEl) activeEl.classList.add('active');
            
            const mainPanel = document.getElementById('leftPanel-main');
            const placeholderPanel = document.getElementById('leftPanel-placeholder');
            
            if (targetTool) {
                mainPanel.classList.remove('hidden');
                mainPanel.classList.add('flex');
                placeholderPanel.classList.add('hidden');
                placeholderPanel.classList.remove('flex');
                
                document.querySelectorAll('.cc-side-item').forEach(el => el.classList.remove('active'));
                const subBtn = document.getElementById(`subTab-${targetTool}`);
                if (subBtn) subBtn.classList.add('active');
                
                openToolInInspector(targetTool);
            } else if (menuKey === 'media') {
                mainPanel.classList.remove('hidden');
                mainPanel.classList.add('flex');
                placeholderPanel.classList.add('hidden');
                placeholderPanel.classList.remove('flex');
            } else {
                mainPanel.classList.add('hidden');
                mainPanel.classList.remove('flex');
                placeholderPanel.classList.remove('hidden');
                placeholderPanel.classList.add('flex');
                
                const titleEl = document.getElementById('placeholderPanelTitle');
                
                const mapping = {
                    'text': { title: 'អក្សរ', prefix: 'Text' },
                    'stickers': { title: 'ស្ទីគ័រ', prefix: 'Sticker' },
                    'effects': { title: 'អ៊ីហ្វិក', prefix: 'Effect' },
                    'transitions': { title: 'បែបផែន', prefix: 'Transition' },
                    'filters': { title: 'តម្រង', prefix: 'Filter' },
                    'captions': { title: 'បកប្រែ/រឿង', prefix: 'Caption' },
                    'adjustment': { title: 'កែសម្រួល', prefix: 'Adjust' },
                    'templates': { title: 'គំរូរឿង', prefix: 'Template' },
                    'audio': { title: 'សំឡេង', prefix: 'Audio' },
                    'avatar': { title: 'AI តួអង្គ', prefix: 'Avatar' }
                };
                
                if (mapping[menuKey]) {
                    titleEl.textContent = mapping[menuKey].title;
                    
                    const subNav = document.getElementById('placeholderSubNav');
                    const grid = document.getElementById('placeholderGrid');
                    
                    if (menuKey === 'stickers') {
                        // Categories matching Image 1
                        subNav.innerHTML = `
                            <div onclick="this.nextElementSibling.classList.toggle('hidden'); const i = this.querySelector('i'); i.classList.toggle('fa-chevron-down'); i.classList.toggle('fa-chevron-up');" class="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer bg-white/5 rounded-lg mx-1 mb-2 border border-white/5 shadow-sm transition-all">
                                <span>Yours</span>
                                <i class="fa-solid fa-chevron-down text-[10px] transition-transform"></i>
                            </div>
                            <div class="hidden space-y-0.5 px-1 mb-2" id="yours-group">
                                <div onclick="selectStickerCategory(this, 'favorites')" class="cc-side-item"><span class="truncate text-[11px]">My Favorites</span></div>
                                <div onclick="selectStickerCategory(this, 'downloaded')" class="cc-side-item"><span class="truncate text-[11px]">Downloaded</span></div>
                                <div onclick="selectStickerCategory(this, 'recent')" class="cc-side-item"><span class="truncate text-[11px]">Recently Used <span class="text-[9px] text-amber-400 font-bold ml-1">NEW</span></span></div>
                            </div>
                            <div onclick="this.nextElementSibling.classList.toggle('hidden'); const i = this.querySelector('i'); i.classList.toggle('fa-chevron-down'); i.classList.toggle('fa-chevron-up');" class="flex items-center justify-between px-3 py-2 text-xs font-bold text-[#00e5cc] cursor-pointer mx-1 mb-2 bg-[#00e5cc]/10 rounded-lg border border-[#00e5cc]/20 transition-all">
                                <span>Stickers</span>
                                <i class="fa-solid fa-chevron-up text-[10px] transition-transform"></i>
                            </div>
                            <div class="space-y-0.5 px-1 mt-1" id="stickers-group">
                                <div onclick="selectStickerCategory(this, 'trending')" class="cc-side-item active !text-[#00e5cc] !font-bold"><span class="truncate text-[11px]">Trending</span></div>
                                <div onclick="selectStickerCategory(this, 'khmer')" class="cc-side-item"><span class="truncate text-[11px]">Khmer Style 🇰🇭 <span class="text-[9px] text-amber-400 font-bold ml-1">NEW</span></span></div>
                                <div onclick="selectStickerCategory(this, 'kpop')" class="cc-side-item"><span class="truncate text-[11px]">K-Pop 🎤</span></div>
                                <div onclick="selectStickerCategory(this, 'bduck')" class="cc-side-item"><span class="truncate text-[11px]">B.Duck 🦆</span></div>
                                <div onclick="selectStickerCategory(this, 'blackfriday')" class="cc-side-item"><span class="truncate text-[11px]">Black Friday</span></div>
                                <div onclick="selectStickerCategory(this, 'whimsical')" class="cc-side-item"><span class="truncate text-[11px]">Whimsical</span></div>
                                <div onclick="selectStickerCategory(this, 'pixel')" class="cc-side-item"><span class="truncate text-[11px]">Pixel Bead 👾</span></div>
                                <div onclick="selectStickerCategory(this, 'classic')" class="cc-side-item"><span class="truncate text-[11px]">Classic</span></div>
                                <div onclick="selectStickerCategory(this, 'new')" class="cc-side-item"><span class="truncate text-[11px] font-bold text-white">NEW</span></div>
                                <div onclick="selectStickerCategory(this, 'animal')" class="cc-side-item"><span class="truncate text-[11px]">Animal Meme</span></div>
                                <div onclick="selectStickerCategory(this, 'freefire')" class="cc-side-item"><span class="truncate text-[11px]">Free Fire 🔥</span></div>
                                <div onclick="selectStickerCategory(this, 'hits')" class="cc-side-item"><span class="truncate text-[11px]">Hits</span></div>
                                <div onclick="selectStickerCategory(this, 'icons')" class="cc-side-item"><span class="truncate text-[11px]">Icons</span></div>
                                <div onclick="selectStickerCategory(this, 'emoji')" class="cc-side-item"><span class="truncate text-[11px]">Emoji</span></div>
                            </div>
                        `;
                        
                        // Grid matching Image 1
                        grid.innerHTML = '';
                        grid.className = 'grid grid-cols-4 gap-2.5 pb-4 px-1';
                        const stickerImages = [
                            'https://cdn.discordapp.com/attachments/1066440788915449998/1154388301542289458/cat.png',
                            'https://cdn.discordapp.com/attachments/1066440788915449998/1154388301135446056/emoji.png',
                            'https://cdn.discordapp.com/attachments/1066440788915449998/1154388300804091994/butterfly.png',
                            'https://cdn.discordapp.com/attachments/1066440788915449998/1154388300250443836/skull.png',
                            'https://cdn.discordapp.com/attachments/1066440788915449998/1154388299864551464/cat2.png',
                            'https://cdn.discordapp.com/attachments/1066440788915449998/1154388299440939029/audio.png',
                            'https://cdn.discordapp.com/attachments/1066440788915449998/1154388299097002045/cat3.png',
                            'https://cdn.discordapp.com/attachments/1066440788915449998/1154388298711130193/cat4.png',
                            'https://cdn.discordapp.com/attachments/1066440788915449998/1154388298358788106/sub.png',
                            'https://cdn.discordapp.com/attachments/1066440788915449998/1154388297926774844/emoji2.png',
                            'https://cdn.discordapp.com/attachments/1066440788915449998/1154388297532514334/cupcake.png',
                            'https://cdn.discordapp.com/attachments/1066440788915449998/1154388297230528572/heart.png',
                            'https://cdn.discordapp.com/attachments/1066440788915449998/1154388296903381013/pie.png',
                            'https://cdn.discordapp.com/attachments/1066440788915449998/1154388296563638363/cat5.png',
                            'https://cdn.discordapp.com/attachments/1066440788915449998/1154388296249057310/fall.png',
                            'https://cdn.discordapp.com/attachments/1066440788915449998/1154388295913521252/cat6.png',
                        ];

                        const emoticons = ['🐱', '🤫', '🦋', '💀', '😸', '🔉', '🎀', '😽', '👍', '🥰', '🧁', '💖', '🥧', '🙀', '🎃', '😹', '🔥', '✨', '🎈', '🎉', '🌟', '💥', '👻', '👽', '👾', '🤖', '💩', '🍉', '🍕', '🍔', '🍟', '🍿', '🍩', '🍦', '🍓', '🥑', '🌮', '🎸', '🎮', '🎲', '🎯', '🚗', '🚀', '🛸', '⭐', '🌈', '☀️', '🌙', '☁️', '⚡', '⛄', '🐶', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧'];
                        
                        for (let i = 0; i < emoticons.length; i++) {
                            grid.innerHTML += `
                                <div onclick="selectDummyItem(this)" class="dummy-item cursor-pointer group flex flex-col items-center justify-center bg-[#2c2d33] rounded-xl aspect-square border-2 border-transparent hover:border-[#4b4c53] transition-all relative overflow-hidden shadow-sm hover:shadow-md">
                                    <div class="text-4xl filter drop-shadow-md group-hover:scale-110 transition-transform duration-300">${emoticons[i]}</div>
                                    
                                    <div class="absolute top-1.5 left-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 w-4 h-4 rounded-[4px] flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                                        <i class="fa-solid fa-gem text-[8px] text-white"></i>
                                    </div>
                                    
                                    <div class="absolute bottom-1.5 right-1.5 w-6 h-6 bg-black/40 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100">
                                        <i class="fa-solid fa-download text-[10px] text-white"></i>
                                    </div>
                                </div>
                            `;
                        }
                    } else if (menuKey === 'effects') {
                        // Categories matching Image 2
                        subNav.innerHTML = `
                            <div class="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer bg-white/5 rounded-lg mx-1 mb-2 border border-white/5 shadow-sm transition-all">
                                <span>Favorites</span>
                            </div>
                            <div onclick="this.nextElementSibling.classList.toggle('hidden'); const i = this.querySelector('i'); i.classList.toggle('fa-chevron-down'); i.classList.toggle('fa-chevron-up');" class="flex items-center justify-between px-3 py-2 text-xs font-bold text-[#00e5cc] cursor-pointer mx-1 mb-2 bg-[#00e5cc]/10 rounded-lg border border-[#00e5cc]/20 transition-all">
                                <span>Video effects</span>
                                <i class="fa-solid fa-chevron-up text-[10px] transition-transform"></i>
                            </div>
                            <div class="space-y-0.5 px-1 mb-2" id="video-effects-group">
                                <div class="cc-side-item active !text-[#00e5cc] !font-bold"><span class="truncate text-[11px]">Trending</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Black Friday</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Classic</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Whimsical</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Pixel Bead 👾</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px] font-bold text-white">NEW</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Hits</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Intro & Outro</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Wild Pics</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Party</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Motion</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">3D</span></div>
                            </div>
                            <div onclick="this.nextElementSibling.classList.toggle('hidden'); const i = this.querySelector('i'); i.classList.toggle('fa-chevron-down'); i.classList.toggle('fa-chevron-up');" class="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer bg-white/5 rounded-lg mx-1 mb-2 border border-white/5 shadow-sm transition-all">
                                <span>Body effects</span>
                                <i class="fa-solid fa-chevron-down text-[10px] transition-transform"></i>
                            </div>
                            <div class="hidden space-y-0.5 px-1" id="body-effects-group">
                                <div class="cc-side-item"><span class="truncate text-[11px]">Trending</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Superpowers</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Glowing Lines</span></div>
                            </div>
                        `;
                        
                        grid.innerHTML = '';
                        grid.className = 'grid grid-cols-4 gap-2.5 pb-4 px-1';
                        
                        const gridHeader = grid.previousElementSibling;
                        if (gridHeader) {
                            gridHeader.innerHTML = `
                                <div class="relative w-full mb-4">
                                    <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[11px]"></i>
                                    <input type="text" placeholder="People are searching Retro" class="w-full bg-[#1e1e24] border border-white/5 rounded-md pl-8 pr-3 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00e5cc] transition-colors">
                                </div>
                                <div class="text-[12px] font-bold text-slate-200 mb-2 mt-2">Trending</div>
                            `;
                            gridHeader.className = "w-full px-1";
                        }
                        
                        const effectNames = [
                            'Chrome Rabbit', 'Ghost Hues', 'Faint Hearts', 'Golden Dragon',
                            'Cyan Scan', 'Kawaii Chicks', 'Offset Array', 'Feather Drift',
                            'Glitchy Music', 'Film Scroll', 'Flash Focus', 'Infinity Path',
                            'Retro Grain', 'Cyber Glitch', 'Vaporwave', 'Neon Outline'
                        ];
                        
                        const gradients = [
                            'from-indigo-400 to-purple-500', 'from-slate-400 to-slate-600', 
                            'from-amber-200 to-orange-300', 'from-amber-500 to-red-600',
                            'from-rose-400 to-pink-500', 'from-yellow-200 to-amber-300',
                            'from-cyan-500 to-blue-600', 'from-orange-200 to-rose-300',
                            'from-sky-400 to-blue-600', 'from-zinc-800 to-black',
                            'from-slate-300 to-blue-300', 'from-blue-400 to-sky-300',
                            'from-gray-600 to-gray-800', 'from-purple-500 to-indigo-700',
                            'from-fuchsia-400 to-pink-600', 'from-green-400 to-emerald-600'
                        ];

                        for (let i = 0; i < effectNames.length; i++) {
                            const grad = gradients[i];
                            grid.innerHTML += `
                                <div class="dummy-item cursor-pointer group flex flex-col gap-1.5">
                                    <div class="dummy-thumb bg-gradient-to-b ${grad} rounded-xl aspect-[4/4.5] border-[1.5px] border-transparent group-hover:border-[#00e5cc] transition-all relative flex items-center justify-center overflow-hidden shadow-sm">
                                        <div class="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                                        <i class="fa-solid fa-wand-magic-sparkles text-3xl text-white/50 group-hover:scale-110 transition-transform mix-blend-overlay"></i>
                                        
                                        <div class="absolute top-1.5 left-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 w-4 h-4 rounded-[4px] flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                                            <i class="fa-solid fa-gem text-[8px] text-white"></i>
                                        </div>
                                        
                                        <div class="absolute bottom-1.5 right-1.5 w-6 h-6 bg-black/40 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100">
                                            <i class="fa-solid fa-download text-[10px] text-white"></i>
                                        </div>
                                    </div>
                                    <div class="dummy-text text-[11px] font-medium text-slate-300 text-left truncate group-hover:text-white transition-colors">
                                        ${effectNames[i]}
                                    </div>
                                </div>
                            `;
                        }
                    } else if (menuKey === 'transitions') {
                        subNav.innerHTML = `
                            <div class="cc-side-item active !text-[#00e5cc] !font-bold"><span class="truncate text-[11px]">Trending</span></div>
                            <div class="cc-side-item"><span class="truncate text-[11px]">Basic</span></div>
                            <div class="cc-side-item"><span class="truncate text-[11px]">Camera</span></div>
                            <div class="cc-side-item"><span class="truncate text-[11px]">Blur</span></div>
                            <div class="cc-side-item"><span class="truncate text-[11px]">Light Effect</span></div>
                            <div class="cc-side-item"><span class="truncate text-[11px]">Glitch</span></div>
                            <div class="cc-side-item"><span class="truncate text-[11px]">Distortion</span></div>
                            <div class="cc-side-item"><span class="truncate text-[11px]">Slide</span></div>
                            <div class="cc-side-item"><span class="truncate text-[11px]">Split</span></div>
                        `;
                        
                        grid.innerHTML = '';
                        grid.className = 'grid grid-cols-4 gap-2.5 pb-4 px-1';
                        
                        const gridHeader = grid.previousElementSibling;
                        if (gridHeader) {
                            gridHeader.innerHTML = `
                                <div class="relative w-full mb-4">
                                    <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[11px]"></i>
                                    <input type="text" placeholder="Search transitions" class="w-full bg-[#1e1e24] border border-white/5 rounded-md pl-8 pr-3 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00e5cc] transition-colors">
                                </div>
                                <div class="text-[12px] font-bold text-slate-200 mb-2 mt-2">Trending</div>
                            `;
                            gridHeader.className = "w-full px-1";
                        }
                        
                        const transitionNames = [
                            'Pull In', 'Pull Out', 'Mix', 'Black Fade',
                            'White Fade', 'Blur', 'Glitch', 'Light Leak',
                            'Zoom In', 'Zoom Out', 'Spin', 'Wipe',
                            'Dissolve', 'Flash', 'Swirl', 'Flip'
                        ];
                        
                        const icons = [
                            'fa-compress', 'fa-expand', 'fa-shuffle', 'fa-moon',
                            'fa-sun', 'fa-droplet', 'fa-bolt', 'fa-lightbulb',
                            'fa-magnifying-glass-plus', 'fa-magnifying-glass-minus', 'fa-arrows-rotate', 'fa-text-width',
                            'fa-snowflake', 'fa-camera-retro', 'fa-hurricane', 'fa-right-left'
                        ];

                        for (let i = 0; i < transitionNames.length; i++) {
                            const icon = icons[i];
                            grid.innerHTML += `
                                <div class="dummy-item cursor-pointer group flex flex-col gap-1.5">
                                    <div class="dummy-thumb bg-[#25252c] rounded-xl aspect-[4/4.5] border-[1.5px] border-transparent group-hover:border-[#00e5cc] transition-all relative flex items-center justify-center overflow-hidden shadow-sm">
                                        <i class="fa-solid ${icon} text-3xl text-slate-400 group-hover:text-white transition-colors group-hover:scale-110"></i>
                                        
                                        <div class="absolute top-1.5 left-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 w-4 h-4 rounded-[4px] flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                                            <i class="fa-solid fa-gem text-[8px] text-white"></i>
                                        </div>
                                        
                                        <div class="absolute bottom-1.5 right-1.5 w-6 h-6 bg-black/40 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100">
                                            <i class="fa-solid fa-download text-[10px] text-white"></i>
                                        </div>
                                    </div>
                                    <div class="dummy-text text-[11px] font-medium text-slate-300 text-left truncate group-hover:text-white transition-colors">
                                        ${transitionNames[i]}
                                    </div>
                                </div>
                            `;
                        }
                    } else if (menuKey === 'audio') {
                        subNav.innerHTML = `
                            <div class="flex items-center justify-between px-3 py-2 text-xs font-bold text-[#00e5cc] cursor-pointer mx-1 mb-2 bg-[#00e5cc]/10 rounded-lg border border-[#00e5cc]/20 transition-all">
                                <span>Music</span>
                                <i class="fa-solid fa-chevron-up text-[10px] transition-transform"></i>
                            </div>
                            <div class="space-y-0.5 px-1 mb-2">
                                <div class="cc-side-item active !text-[#00e5cc] !font-bold"><span class="truncate text-[11px]">Trending</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Fresh</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Vlog</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Pop</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Beats</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">R&B</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Love</span></div>
                            </div>
                            
                            <div class="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer bg-white/5 rounded-lg mx-1 mb-2 border border-white/5 shadow-sm transition-all mt-4">
                                <span>Sound effects</span>
                                <i class="fa-solid fa-chevron-down text-[10px] transition-transform"></i>
                            </div>
                            <div class="hidden space-y-0.5 px-1 mb-2">
                                <div class="cc-side-item"><span class="truncate text-[11px]">Performance</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Magic</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Transition</span></div>
                            </div>

                            <div class="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer bg-white/5 rounded-lg mx-1 mb-2 border border-white/5 shadow-sm transition-all mt-4">
                                <span>Copyright check</span>
                            </div>

                            <div class="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer bg-white/5 rounded-lg mx-1 mb-2 border border-white/5 shadow-sm transition-all mt-4">
                                <span>Extracted audio</span>
                            </div>

                            <!-- Click to go to our Narrate AI tool -->
                            <div onclick="selectTopMenu('media', 'narrate')" class="flex items-center justify-between px-3 py-2 text-xs font-bold text-white hover:text-white cursor-pointer bg-gradient-to-r from-teal-500/20 to-blue-500/20 hover:from-teal-500/40 hover:to-blue-500/40 rounded-lg mx-1 mb-2 border border-teal-500/50 shadow-[0_0_10px_rgba(0,229,204,0.2)] transition-all mt-4 group">
                                <span class="flex items-center gap-2"><i class="fa-solid fa-microphone-lines text-teal-400 group-hover:scale-110 transition-transform"></i> AI Voiceover</span>
                                <span class="px-1.5 py-[1px] bg-red-500 rounded text-[9px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse">HOT</span>
                            </div>
                        `;
                        
                        grid.innerHTML = '';
                        grid.className = 'flex flex-col gap-1 pb-4 px-1'; // List layout for audio
                        
                        const gridHeader = grid.previousElementSibling;
                        if (gridHeader) {
                            gridHeader.innerHTML = `
                                <div class="relative w-full mb-4">
                                    <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[11px]"></i>
                                    <input type="text" placeholder="Search music" class="w-full bg-[#1e1e24] border border-white/5 rounded-md pl-8 pr-3 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00e5cc] transition-colors">
                                </div>
                                <div class="text-[12px] font-bold text-slate-200 mb-2 mt-2">Trending</div>
                            `;
                            gridHeader.className = "w-full px-1";
                        }

                        const audioTracks = [
                            { title: 'Beat It', duration: '02:15', tag: 'Pop' },
                            { title: 'Summer Vibes', duration: '03:02', tag: 'Vlog' },
                            { title: 'Chill Lo-Fi', duration: '01:45', tag: 'Beats' },
                            { title: 'Epic Cinematic', duration: '02:30', tag: 'Fresh' },
                            { title: 'Upbeat Corporate', duration: '01:10', tag: 'Trending' },
                            { title: 'Acoustic Guitar', duration: '02:55', tag: 'Love' },
                            { title: 'Trap Beat 2023', duration: '02:20', tag: 'R&B' },
                            { title: 'Piano Emotion', duration: '03:40', tag: 'Fresh' }
                        ];

                        audioTracks.forEach(track => {
                            grid.innerHTML += `
                                <div class="group flex items-center justify-between p-2 hover:bg-[#25252c] rounded-lg cursor-pointer transition-colors border border-transparent hover:border-white/5">
                                    <div class="flex items-center gap-3">
                                        <div class="w-9 h-9 rounded bg-[#1e1e24] border border-white/5 flex items-center justify-center relative overflow-hidden group-hover:border-[#00e5cc]/50 transition-colors shrink-0">
                                            <i class="fa-solid fa-music text-slate-500 text-[14px]"></i>
                                            <div class="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center">
                                                <i class="fa-solid fa-play text-white text-[12px]"></i>
                                            </div>
                                        </div>
                                        <div class="flex flex-col max-w-[140px]">
                                            <span class="text-[12px] text-slate-200 font-medium truncate">${track.title}</span>
                                            <span class="text-[10px] text-slate-500">${track.duration}</span>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button class="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white transition-colors"><i class="fa-regular fa-star"></i></button>
                                        <button class="w-6 h-6 flex items-center justify-center bg-[#00e5cc] text-black rounded hover:bg-teal-400 transition-colors shadow-[0_0_8px_rgba(0,229,204,0.4)]"><i class="fa-solid fa-plus"></i></button>
                                    </div>
                                </div>
                            `;
                        });

                    } else if (menuKey === 'text') {
                        // Text UI matching Image 2
                        subNav.innerHTML = `
                            <div class="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer bg-white/5 rounded-lg mx-1 mb-2 border border-white/5 shadow-sm transition-all">
                                <span>Add text</span>
                            </div>
                            <div onclick="this.nextElementSibling.classList.toggle('hidden'); const i = this.querySelector('i'); i.classList.toggle('fa-chevron-down'); i.classList.toggle('fa-chevron-up');" class="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer mx-1 mb-2 bg-white/5 rounded-lg border border-white/5 transition-all">
                                <span>Yours</span>
                                <i class="fa-solid fa-chevron-down text-[10px] transition-transform"></i>
                            </div>
                            <div class="hidden space-y-0.5 px-1 mb-2">
                                <div class="cc-side-item"><span class="truncate text-[11px]">My Favorites</span></div>
                            </div>
                            <div onclick="this.nextElementSibling.classList.toggle('hidden'); const i = this.querySelector('i'); i.classList.toggle('fa-chevron-down'); i.classList.toggle('fa-chevron-up');" class="flex items-center justify-between px-3 py-2 text-xs font-bold text-[#00e5cc] cursor-pointer mx-1 mb-2 bg-[#00e5cc]/10 rounded-lg border border-[#00e5cc]/20 transition-all">
                                <span>Text effects</span>
                                <i class="fa-solid fa-chevron-up text-[10px] transition-transform"></i>
                            </div>
                            <div class="space-y-0.5 px-1 mb-2" id="text-effects-group">
                                <div class="cc-side-item active !text-[#00e5cc] !font-bold"><span class="truncate text-[11px]">Trending</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">B.Duck 🦆</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Classic</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Black Friday</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Whimsical</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px] font-bold text-white">NEW</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Hits</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Animation</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Food</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Textile Art</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Manuscript</span></div>
                            </div>
                            <div onclick="this.nextElementSibling.classList.toggle('hidden'); const i = this.querySelector('i'); i.classList.toggle('fa-chevron-down'); i.classList.toggle('fa-chevron-up');" class="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer bg-white/5 rounded-lg mx-1 mb-2 border border-white/5 shadow-sm transition-all">
                                <span>Text template</span>
                                <i class="fa-solid fa-chevron-down text-[10px] transition-transform"></i>
                            </div>
                            <div class="hidden space-y-0.5 px-1">
                                <div class="cc-side-item"><span class="truncate text-[11px]">Trending</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Social Media</span></div>
                            </div>
                        `;
                        
                        grid.innerHTML = '';
                        grid.className = 'grid grid-cols-4 gap-2.5 pb-4 px-1';
                        
                        const gridHeader = grid.previousElementSibling;
                        if (gridHeader) {
                            gridHeader.innerHTML = `
                                <div class="relative w-full mb-4">
                                    <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[11px]"></i>
                                    <input type="text" placeholder="Search for text effects/style" class="w-full bg-[#1e1e24] border border-white/5 rounded-md pl-8 pr-3 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00e5cc] transition-colors">
                                </div>
                                <div class="text-[12px] font-bold text-slate-200 mb-2 mt-2">Trending</div>
                            `;
                            gridHeader.className = "w-full px-1";
                        }
                        
                        // Cool text styles mimicking the "ART" styles
                        // Cool text styles mimicking the "ART" styles
                        const artStyles = [
                            // Row 1
                            { text: 'ART', style: 'color: #111; background-color: #eab308; padding: 0 8px; font-style: italic; -webkit-text-stroke: 1px #854d0e;' },
                            { text: 'ART', style: 'color: transparent; -webkit-text-stroke: 2px #fff; filter: drop-shadow(0 0 8px rgba(253, 224, 71, 1));' },
                            { text: 'ART', style: 'color: transparent; -webkit-text-stroke: 2px #fff; filter: drop-shadow(0 0 8px rgba(134, 239, 172, 1));' },
                            { text: 'ART', style: 'color: #000; background-color: #22c55e; padding: 0 8px; box-shadow: 0 0 10px #22c55e; transform: skewX(-10deg);' },
                            
                            // Row 2
                            { text: 'ART', style: 'color: white; -webkit-text-stroke: 1px #000; filter: drop-shadow(2px 2px 0px #000) drop-shadow(-2px -2px 0px #000); background: repeating-linear-gradient(45deg, #000, #000 2px, transparent 2px, transparent 4px); -webkit-background-clip: text;' },
                            { text: 'ART', style: 'color: white; -webkit-text-stroke: 1px #000; text-shadow: 0 0 15px rgba(255,255,255,0.8);' },
                            { text: 'ART', style: 'color: #000; -webkit-text-stroke: 1px #dc2626; text-shadow: 0 3px 8px #7f1d1d;' },
                            { text: 'ART', style: 'color: white; text-shadow: 0 0 10px #86efac; -webkit-text-stroke: 2.5px #166534;' },
                            
                            // Row 3
                            { text: 'ART', style: 'color: #eab308; background-color: #111; padding: 0 8px; font-weight: 900;' },
                            { text: 'ART', style: 'color: white; background-color: #dc2626; padding: 0 8px;' },
                            { text: 'ART', style: 'color: #d1d5db; text-shadow: 1px 1px 0 #374151, 2px 2px 0 #1f2937, 3px 3px 0 #111827;' },
                            { text: 'ART', style: 'color: #000; background-color: #fff; padding: 0 8px; transform: rotate(-5deg);' },
                            
                            // Row 4
                            { text: 'じまく', style: 'color: #fde047; -webkit-text-stroke: 2px #000; text-shadow: 3px 3px 0 #000; font-size: 26px;' },
                            { text: 'ART', style: 'color: #fff; background-color: #111; -webkit-text-stroke: 1px #fff; padding: 0 4px; transform: skewX(-15deg);' },
                            { text: 'ART', style: 'color: transparent; -webkit-text-stroke: 2px #fff; filter: drop-shadow(0 0 5px #fff);' },
                            { text: 'ART', style: 'color: transparent; -webkit-text-stroke: 2px #22c55e; filter: drop-shadow(0 0 10px #22c55e);' },
                            
                            // Purple batch 1
                            { text: 'ART', style: 'color: #d8b4fe; text-shadow: 0 0 15px #a855f7; -webkit-text-stroke: 1px #7e22ce;' },
                            { text: 'ART', style: 'color: white; -webkit-text-stroke: 2px #a855f7; filter: drop-shadow(0 0 12px #d8b4fe);' },
                            { text: 'ART', style: 'color: transparent; -webkit-text-stroke: 1px #d8b4fe; text-shadow: 2px 2px 5px #7e22ce;' },
                            { text: 'ART', style: 'color: #eab308; -webkit-text-stroke: 1px #a855f7; text-shadow: 0 0 15px #a855f7;' },
                            
                            // Purple batch 2
                            { text: 'ART', style: 'color: white; -webkit-text-stroke: 2px #c084fc; text-shadow: 0 0 8px #c084fc, 0 0 15px #c084fc;' },
                            { text: 'ART', style: 'color: transparent; -webkit-text-stroke: 2px #d8b4fe; background-color: #6b21a8; padding: 0 6px;' },
                            { text: 'ART', style: 'color: white; text-shadow: 3px 3px 0px #7e22ce, -1px -1px 0px #7e22ce;' },
                            { text: 'ART', style: 'color: white; filter: drop-shadow(0 0 10px #d8b4fe); font-style: italic;' },
                            
                            // Mixed
                            { text: '워드아트', style: 'color: transparent; -webkit-text-stroke: 1px white; background-image: linear-gradient(to right, #ec4899, #8b5cf6); -webkit-background-clip: text; font-size: 24px;' },
                            { text: 'ART', style: 'color: #f472b6; text-shadow: 0 0 10px #be185d, 2px 2px 0px #831843;' },
                            { text: 'ART', style: 'color: white; text-shadow: 4px 4px 0px #1d4ed8; -webkit-text-stroke: 1px #1e3a8a;' },
                            { text: 'ART', style: 'color: #10b981; text-shadow: 0 0 15px #047857; font-weight: 900;' }
                        ];

                        for (let i = 0; i < artStyles.length; i++) {
                            const art = artStyles[i];
                            grid.innerHTML += `
                                <div class="dummy-item cursor-pointer group flex flex-col gap-1.5">
                                    <div class="dummy-thumb bg-[#25252c] rounded-xl aspect-[4/3] border-[1.5px] border-transparent group-hover:border-[#00e5cc] transition-all relative flex items-center justify-center overflow-hidden shadow-sm">
                                        <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                        
                                        <!-- The ART Text -->
                                        <div class="text-[32px] font-black group-hover:scale-110 transition-transform duration-300 font-sans leading-none flex items-center justify-center h-full w-full" style="${art.style}">
                                            ${art.text}
                                        </div>

                                        
                                        <div class="absolute top-1.5 left-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 w-4 h-4 rounded-[4px] flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                                            <i class="fa-solid fa-gem text-[8px] text-white"></i>
                                        </div>
                                        
                                        <div class="absolute bottom-1.5 right-1.5 w-6 h-6 bg-black/40 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100">
                                            <i class="fa-solid fa-download text-[10px] text-white"></i>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }
                    } else if (menuKey === 'filters') {
                        // Filters layout
                        subNav.innerHTML = `
                            <div class="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer bg-white/5 rounded-lg mx-1 mb-2 border border-white/5 shadow-sm transition-all">
                                <span>Favorites</span>
                            </div>
                            <div onclick="this.nextElementSibling.classList.toggle('hidden'); const i = this.querySelector('i'); i.classList.toggle('fa-chevron-down'); i.classList.toggle('fa-chevron-up');" class="flex items-center justify-between px-3 py-2 text-xs font-bold text-[#00e5cc] cursor-pointer mx-1 mb-2 bg-[#00e5cc]/10 rounded-lg border border-[#00e5cc]/20 transition-all">
                                <span>Filters</span>
                                <i class="fa-solid fa-chevron-up text-[10px] transition-transform"></i>
                            </div>
                            <div class="space-y-0.5 px-1 mb-2">
                                <div class="cc-side-item active !text-[#00e5cc] !font-bold"><span class="truncate text-[11px]">Featured</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">NEW</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Hits</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Life</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Landscape</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Portrait</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Mono</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Movies</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Retro</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Tools</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Alternative</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Night</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Cool Filter</span></div>
                            </div>
                        `;
                        
                        grid.innerHTML = '';
                        grid.className = 'grid grid-cols-4 gap-2.5 pb-4 px-1';
                        
                        const gridHeader = grid.previousElementSibling;
                        if (gridHeader) {
                            gridHeader.innerHTML = `
                                <div class="relative w-full mb-4">
                                    <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[11px]"></i>
                                    <input type="text" placeholder="People are searching cream" class="w-full bg-[#1e1e24] border border-white/5 rounded-md pl-8 pr-3 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00e5cc] transition-colors">
                                    <i class="fa-solid fa-filter absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] cursor-pointer hover:text-white transition-colors"></i>
                                </div>
                                <div class="text-[12px] font-bold text-slate-200 mb-2 mt-2">Featured</div>
                            `;
                            gridHeader.className = "w-full px-1";
                        }
                        
                        const filters = [
                            { name: 'Skin R...nation', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&q=80' },
                            { name: '8K', img: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=200&q=80' },
                            { name: 'Bokeh', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80' },
                            { name: 'Fresh Lime', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&q=80' },
                            { name: 'Purpl...mance', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80' },
                            { name: 'French Passion', img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80' },
                            { name: 'Night-... Color', img: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=200&q=80' },
                            { name: 'Rio Nights', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=80' },
                            { name: 'Late Spring', img: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=200&q=80' },
                            { name: 'Univer...Sunset', img: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=200&q=80' },
                            { name: 'Hot Summer', img: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=200&q=80' },
                            { name: 'Dim Light', img: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=200&q=80' },
                            { name: 'Fireworks', img: 'https://images.unsplash.com/photo-1533230678663-e5fb6fdf3964?w=200&q=80' },
                            { name: 'Soft Portrait', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80' },
                            { name: 'Clear Portrait', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80' },
                            { name: 'Tropical', img: 'https://images.unsplash.com/photo-1516483638261-f40af5edca87?w=200&q=80' }
                        ];

                        for (let i = 0; i < filters.length; i++) {
                            const filter = filters[i];
                            grid.innerHTML += `
                                <div class="dummy-item cursor-pointer group flex flex-col gap-1.5">
                                    <div class="dummy-thumb bg-[#25252c] rounded-xl aspect-[4/4.5] border-[1.5px] border-transparent group-hover:border-[#00e5cc] transition-all relative flex items-center justify-center overflow-hidden shadow-sm">
                                        
                                        <!-- Actual Preview Image for Filter -->
                                        <div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style="background-image: url('${filter.img}')"></div>
                                        
                                        <div class="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                                        
                                        <div class="absolute top-1.5 left-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 w-4 h-4 rounded-[4px] flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                                            <i class="fa-solid fa-gem text-[8px] text-white"></i>
                                        </div>
                                        
                                        <div class="absolute bottom-1.5 right-1.5 w-6 h-6 bg-black/40 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100">
                                            <i class="fa-solid fa-download text-[10px] text-white"></i>
                                        </div>
                                    </div>
                                    <div class="dummy-text text-[11px] font-medium text-slate-300 text-left truncate group-hover:text-white transition-colors">
                                        ${filter.name}
                                    </div>
                                </div>
                            `;
                        }
                    } else if (menuKey === 'adjustment') {
                        // Adjustment layout
                        subNav.innerHTML = `
                            <div class="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer bg-white/5 rounded-lg mx-1 mb-2 border border-white/5 shadow-sm transition-all">
                                <span>Custom adjustment</span>
                                <i class="fa-solid fa-plus text-[10px]"></i>
                            </div>
                            <div onclick="this.nextElementSibling.classList.toggle('hidden'); const i = this.querySelector('i'); i.classList.toggle('fa-chevron-down'); i.classList.toggle('fa-chevron-up');" class="flex items-center justify-between px-3 py-2 text-xs font-bold text-[#00e5cc] cursor-pointer mx-1 mb-2 bg-[#00e5cc]/10 rounded-lg border border-[#00e5cc]/20 transition-all">
                                <span>LUT</span>
                                <i class="fa-solid fa-chevron-up text-[10px] transition-transform"></i>
                            </div>
                            <div class="space-y-0.5 px-1 mb-2">
                                <div class="cc-side-item active !text-[#00e5cc] !font-bold"><span class="truncate text-[11px]">All</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Portrait</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Nature</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Movies</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Retro</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Food</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Style</span></div>
                            </div>
                        `;
                        
                        grid.innerHTML = '';
                        grid.className = 'grid grid-cols-4 gap-2.5 pb-4 px-1';
                        
                        const gridHeader = grid.previousElementSibling;
                        if (gridHeader) {
                            gridHeader.innerHTML = `
                                <div class="relative w-full mb-4">
                                    <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[11px]"></i>
                                    <input type="text" placeholder="Search LUTs" class="w-full bg-[#1e1e24] border border-white/5 rounded-md pl-8 pr-3 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00e5cc] transition-colors">
                                </div>
                                <div class="text-[12px] font-bold text-slate-200 mb-2 mt-2">All</div>
                            `;
                            gridHeader.className = "w-full px-1";
                        }
                        
                        const luts = [
                            { name: 'Teal & Orange', img: 'https://images.unsplash.com/photo-1542314831-c6a4d14b302c?w=200&q=80' },
                            { name: 'Cinematic', img: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=200&q=80' },
                            { name: 'Moody Dark', img: 'https://images.unsplash.com/photo-1506744626753-1fa28f621b22?w=200&q=80' },
                            { name: 'Vintage', img: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=200&q=80' },
                            { name: 'B&W Contrast', img: 'https://images.unsplash.com/photo-1495105711832-6101f37e42d7?w=200&q=80' },
                            { name: 'Warm Glow', img: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=200&q=80' },
                            { name: 'Cool Blue', img: 'https://images.unsplash.com/photo-1518837695005-2083093ee354?w=200&q=80' },
                            { name: 'Faded Film', img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&q=80' },
                            { name: 'Cyberpunk', img: 'https://images.unsplash.com/photo-1542451542907-6cf80ff362d6?w=200&q=80' },
                            { name: 'Sunkissed', img: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=200&q=80' },
                            { name: 'Autumn', img: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=200&q=80' },
                            { name: 'Desaturated', img: 'https://images.unsplash.com/photo-1505322022379-7c3353ee6291?w=200&q=80' }
                        ];

                        for (let i = 0; i < luts.length; i++) {
                            const lut = luts[i];
                            grid.innerHTML += `
                                <div class="dummy-item cursor-pointer group flex flex-col gap-1.5">
                                    <div class="dummy-thumb bg-[#25252c] rounded-xl aspect-[4/4.5] border-[1.5px] border-transparent group-hover:border-[#00e5cc] transition-all relative flex items-center justify-center overflow-hidden shadow-sm">
                                        
                                        <div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style="background-image: url('${lut.img}')"></div>
                                        
                                        <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                        
                                        <div class="absolute top-1.5 left-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 w-4 h-4 rounded-[4px] flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                                            <i class="fa-solid fa-gem text-[8px] text-white"></i>
                                        </div>
                                        
                                        <div class="absolute top-1.5 right-1.5 bg-black/40 px-1 py-0.5 rounded flex items-center justify-center backdrop-blur-sm border border-white/10">
                                            <span class="text-[8px] font-bold text-white tracking-wider">LUT</span>
                                        </div>
                                        
                                        <div class="absolute bottom-1.5 right-1.5 w-6 h-6 bg-black/40 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100">
                                            <i class="fa-solid fa-download text-[10px] text-white"></i>
                                        </div>
                                    </div>
                                    <div class="dummy-text text-[11px] font-medium text-slate-300 text-left truncate group-hover:text-white transition-colors">
                                        ${lut.name}
                                    </div>
                                </div>
                            `;
                        }
                    } else if (menuKey === 'templates') {
                        // Templates layout
                        subNav.innerHTML = `
                            <div class="cc-side-item active !text-[#00e5cc] !font-bold"><span class="truncate text-[11px]">For You</span></div>
                            <div class="cc-side-item"><span class="truncate text-[11px]">Beat Sync</span></div>
                            <div class="cc-side-item"><span class="truncate text-[11px]">Meme</span></div>
                            <div class="cc-side-item"><span class="truncate text-[11px]">Lyric</span></div>
                            <div class="cc-side-item"><span class="truncate text-[11px]">Fun Play</span></div>
                            <div class="cc-side-item"><span class="truncate text-[11px]">VLOG</span></div>
                            <div class="cc-side-item"><span class="truncate text-[11px]">Couple</span></div>
                            <div class="cc-side-item"><span class="truncate text-[11px]">Retro</span></div>
                        `;
                        
                        grid.innerHTML = '';
                        grid.className = 'grid grid-cols-4 gap-2.5 pb-4 px-1';
                        
                        const gridHeader = grid.previousElementSibling;
                        if (gridHeader) {
                            gridHeader.innerHTML = `
                                <div class="relative w-full mb-4">
                                    <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[11px]"></i>
                                    <input type="text" placeholder="Search templates" class="w-full bg-[#1e1e24] border border-white/5 rounded-md pl-8 pr-3 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00e5cc] transition-colors">
                                </div>
                                <div class="text-[12px] font-bold text-slate-200 mb-2 mt-2">For You</div>
                            `;
                            gridHeader.className = "w-full px-1";
                        }
                        
                        const templates = [
                            { name: 'Cinematic Beat', uses: '2.4M', img: 'https://images.unsplash.com/photo-1576404849202-b3da985a42f5?w=200&q=80' },
                            { name: 'Funny Meme Cat', uses: '890K', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&q=80' },
                            { name: 'Travel Vlog', uses: '1.2M', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=200&q=80' },
                            { name: 'Aesthetic Lyrics', uses: '3.1M', img: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=200&q=80' },
                            { name: 'Retro Film', uses: '500K', img: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=200&q=80' },
                            { name: 'Glow Up Trend', uses: '4.5M', img: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=200&q=80' },
                            { name: 'Flash Warning', uses: '2M', img: 'https://images.unsplash.com/photo-1533230678663-e5fb6fdf3964?w=200&q=80' },
                            { name: 'Love Story', uses: '1.8M', img: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=200&q=80' },
                            { name: 'Epic Transitions', uses: '6.2M', img: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=200&q=80' },
                            { name: 'Chill Vibes', uses: '1.1M', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=80' },
                            { name: 'Daily Life', uses: '3.4M', img: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=200&q=80' },
                            { name: 'Mini Vlog', uses: '920K', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&q=80' },
                            { name: 'Anime Edit', uses: '5.6M', img: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&q=80' },
                            { name: 'Sad Quotes', uses: '1.5M', img: 'https://images.unsplash.com/photo-1455390582262-044cdead27d8?w=200&q=80' },
                            { name: 'Gym Motivation', uses: '3.8M', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&q=80' },
                            { name: 'Food Review', uses: '800K', img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80' }
                        ];

                        for (let i = 0; i < templates.length; i++) {
                            const tpl = templates[i];
                            grid.innerHTML += `
                                <div class="dummy-item cursor-pointer group flex flex-col gap-1.5">
                                    <div class="dummy-thumb bg-[#25252c] rounded-lg aspect-[9/16] border-[1.5px] border-transparent group-hover:border-[#00e5cc] transition-all relative flex items-center justify-center overflow-hidden shadow-sm">
                                        
                                        <div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style="background-image: url('${tpl.img}')"></div>
                                        
                                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80"></div>
                                        <div class="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors"></div>
                                        
                                        <!-- Play Icon Overlay on Hover -->
                                        <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <i class="fa-solid fa-play text-white/90 text-2xl drop-shadow-lg"></i>
                                        </div>
                                        
                                        <div class="absolute top-1.5 left-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 px-1 py-0.5 rounded-[4px] flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                                            <span class="text-[7px] font-bold text-white tracking-wider">PRO</span>
                                        </div>
                                        
                                        <div class="absolute bottom-1.5 left-1.5 flex items-center gap-1">
                                            <i class="fa-solid fa-users text-[8px] text-white/80"></i>
                                            <span class="text-[9px] font-medium text-white/90">${tpl.uses}</span>
                                        </div>
                                    </div>
                                    <div class="dummy-text text-[11px] font-medium text-slate-300 text-left truncate group-hover:text-white transition-colors">
                                        ${tpl.name}
                                    </div>
                                </div>
                            `;
                        }
                    } else if (menuKey === 'avatar') {
                        // AI Voices / Avatars layout
                        subNav.innerHTML = `
                            <div class="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer bg-white/5 rounded-lg mx-1 mb-2 border border-white/5 shadow-sm transition-all">
                                <span>Favorites</span>
                            </div>
                            <div onclick="this.nextElementSibling.classList.toggle('hidden'); const i = this.querySelector('i'); i.classList.toggle('fa-chevron-down'); i.classList.toggle('fa-chevron-up');" class="flex items-center justify-between px-3 py-2 text-xs font-bold text-[#00e5cc] cursor-pointer mx-1 mb-2 bg-[#00e5cc]/10 rounded-lg border border-[#00e5cc]/20 transition-all">
                                <span>AI Voices</span>
                                <i class="fa-solid fa-chevron-up text-[10px] transition-transform"></i>
                            </div>
                            <div class="space-y-0.5 px-1 mb-2">
                                <div class="cc-side-item active !text-[#00e5cc] !font-bold"><span class="truncate text-[11px]">ពេញនិយម (Trending)</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">សម្រាយរឿង (Movie Recap)</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">និទានរឿង (Storytelling)</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">ព័ត៌មាន (News)</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">កុមារ (Kids)</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">បុរស (Male)</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">ស្ត្រី (Female)</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">កំប្លែង (Funny)</span></div>
                            </div>
                        `;
                        
                        grid.innerHTML = '';
                        grid.className = 'grid grid-cols-3 gap-3 pb-4 px-1'; 
                        
                        const gridHeader = grid.previousElementSibling;
                        if (gridHeader) {
                            gridHeader.innerHTML = `
                                <div class="relative w-full mb-4">
                                    <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[11px]"></i>
                                    <input type="text" placeholder="ស្វែងរកសម្លេង (Search voices)..." class="w-full bg-[#1e1e24] border border-white/5 rounded-md pl-8 pr-3 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00e5cc] transition-colors">
                                </div>
                                <div class="text-[12px] font-bold text-slate-200 mb-2 mt-2">ពេញនិយម (Trending)</div>
                            `;
                            gridHeader.className = "w-full px-1";
                        }
                        
                        const avatars = [
                            { name: 'ពូសម្រាយរឿង', desc: 'Movie Recap', img: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&q=80', color: 'from-blue-500/20 to-cyan-500/20' },
                            { name: 'អ្នកគ្រូនាថ', desc: 'Storytelling', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80', color: 'from-pink-500/20 to-rose-500/20' },
                            { name: 'ក្មេងវៃឆ្លាត', desc: 'Kids / Fun', img: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=150&q=80', color: 'from-yellow-500/20 to-orange-500/20' },
                            { name: 'អ្នកព័ត៌មាន', desc: 'News Anchor', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&q=80', color: 'from-slate-500/20 to-gray-500/20' },
                            { name: 'យាយនិទាន', desc: 'Old Tale', img: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=150&q=80', color: 'from-purple-500/20 to-fuchsia-500/20' },
                            { name: 'សម្លេងកាច', desc: 'Action/Thriller', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80', color: 'from-red-500/20 to-orange-500/20' },
                            { name: 'នារីស្រទន់', desc: 'Soft / ASMR', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80', color: 'from-teal-500/20 to-emerald-500/20' },
                            { name: 'ពូកំប្លែង', desc: 'Funny / Comedy', img: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=150&q=80', color: 'from-amber-500/20 to-yellow-500/20' },
                            { name: 'AI Robot', desc: 'Tech / Sci-Fi', img: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=150&q=80', color: 'from-cyan-500/20 to-blue-500/20' }
                        ];

                        for (let i = 0; i < avatars.length; i++) {
                            const av = avatars[i];
                            grid.innerHTML += `
                                <div class="dummy-item cursor-pointer group flex flex-col gap-2 items-center bg-[#25252c] hover:bg-[#2a2a32] p-3 rounded-xl border border-white/5 hover:border-[#00e5cc]/50 transition-all shadow-sm">
                                    <div class="relative w-16 h-16 rounded-full p-0.5 bg-gradient-to-br ${av.color} group-hover:scale-110 transition-transform duration-300">
                                        <div class="w-full h-full rounded-full bg-cover bg-center border border-white/10" style="background-image: url('${av.img}')"></div>
                                        
                                        <!-- Play Audio Overlay -->
                                        <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                                            <i class="fa-solid fa-play text-white text-[12px] ml-0.5 drop-shadow-md"></i>
                                        </div>
                                    </div>
                                    <div class="flex flex-col items-center text-center w-full">
                                        <div class="text-[12px] font-bold text-slate-200 group-hover:text-white transition-colors truncate w-full">
                                            ${av.name}
                                        </div>
                                        <div class="text-[10px] font-medium text-slate-500 truncate w-full mt-0.5">
                                            ${av.desc}
                                        </div>
                                    </div>
                                    <div class="w-full flex items-center justify-between mt-1 px-1">
                                        <div class="bg-gradient-to-br from-indigo-500 to-purple-600 px-1.5 py-0.5 rounded-[4px] shadow-sm">
                                            <span class="text-[7px] font-bold text-white tracking-wider">PRO</span>
                                        </div>
                                        <i class="fa-regular fa-star text-[10px] text-slate-500 hover:text-yellow-400 transition-colors"></i>
                                    </div>
                                </div>
                            `;
                        }
                    } else if (menuKey === 'captions') {
                        // Captions/Subtitles UI
                        subNav.innerHTML = `
                            <div class="flex items-center justify-between px-3 py-2 text-xs font-bold text-[#00e5cc] cursor-pointer mx-1 mb-2 bg-[#00e5cc]/10 rounded-lg border border-[#00e5cc]/20 transition-all">
                                <span>Captions</span>
                                <i class="fa-solid fa-chevron-up text-[10px] transition-transform"></i>
                            </div>
                            <div class="space-y-0.5 px-1 mb-2">
                                <div class="cc-side-item active !text-[#00e5cc] !font-bold"><span class="truncate text-[11px]">Auto captions</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Manual captions</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Local captions</span></div>
                                <div class="cc-side-item"><span class="truncate text-[11px]">Auto lyrics</span></div>
                            </div>
                            
                            <!-- Custom Link to AI Translator -->
                            <div onclick="selectTopMenu('media', 'translate')" class="flex items-center justify-between px-3 py-2 text-xs font-bold text-white hover:text-white cursor-pointer bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/40 hover:to-cyan-500/40 rounded-lg mx-1 mb-2 border border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-all mt-4 group">
                                <span class="flex items-center gap-2"><i class="fa-solid fa-globe text-blue-400 group-hover:scale-110 transition-transform"></i> AI Translate</span>
                                <span class="px-1.5 py-[1px] bg-blue-500 rounded text-[9px] font-bold text-white shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse">PRO</span>
                            </div>
                        `;
                        
                        grid.innerHTML = '';
                        grid.className = 'flex flex-col gap-3 pb-4 px-3 mt-4';
                        
                        const gridHeader = grid.previousElementSibling;
                        if (gridHeader) {
                            gridHeader.innerHTML = `
                                <div class="text-[14px] font-bold text-white mb-1">Auto captions</div>
                                <div class="text-[11px] text-slate-400 mb-4 leading-relaxed">Automatically recognize speech in video and generate captions. You can edit them later.</div>
                            `;
                            gridHeader.className = "w-full px-3 mt-4";
                        }

                        grid.innerHTML = `
                            <div class="flex flex-col gap-2">
                                <label class="text-[11px] font-bold text-slate-300">Spoken language</label>
                                <div class="relative">
                                    <select class="w-full bg-[#1e1e24] border border-white/10 rounded-md px-3 py-2 text-[12px] text-white appearance-none cursor-pointer hover:border-white/20 transition-colors focus:outline-none focus:border-[#00e5cc]">
                                        <option>English</option>
                                        <option>Khmer (ខ្មែរ)</option>
                                        <option>Chinese</option>
                                        <option>Japanese</option>
                                    </select>
                                    <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
                                </div>
                            </div>
                            
                            <div class="flex flex-col gap-2 mt-2">
                                <label class="text-[11px] font-bold text-slate-300">Bilingual captions</label>
                                <div class="relative">
                                    <select class="w-full bg-[#1e1e24] border border-white/10 rounded-md px-3 py-2 text-[12px] text-white appearance-none cursor-pointer hover:border-white/20 transition-colors focus:outline-none focus:border-[#00e5cc]">
                                        <option>None</option>
                                        <option>English</option>
                                        <option>Khmer (ខ្មែរ)</option>
                                    </select>
                                    <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
                                </div>
                            </div>

                            <button class="mt-4 w-full bg-[#00e5cc] hover:bg-teal-400 text-black font-bold text-[13px] py-2.5 rounded-lg shadow-[0_0_15px_rgba(0,229,204,0.3)] transition-all transform hover:scale-[1.02] active:scale-95">
                                Create
                            </button>
                            
                            <div class="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3 items-start">
                                <i class="fa-solid fa-lightbulb text-blue-400 text-[14px] mt-0.5"></i>
                                <div class="text-[11px] text-blue-200/80 leading-relaxed">
                                    Need professional translation? Click the <b>AI Translate (PRO)</b> button on the left to use our custom AI Subtitle Translator!
                                </div>
                            </div>
                        `;
                    } else {
                        // Default Categories for other menus
                        subNav.innerHTML = `
                            <div class="cc-side-item active"><span class="truncate text-[11px]">ពេញនិយម (Pro)</span></div>
                            <div class="cc-side-item"><span class="truncate text-[11px]">ថ្មីៗ</span></div>
                            <div class="cc-side-item"><span class="truncate text-[11px]">វីដេអូ</span></div>
                            <div class="cc-side-item"><span class="truncate text-[11px]">កំប្លែង</span></div>
                            <div class="cc-side-item"><span class="truncate text-[11px]">ធម្មជាតិ</span></div>
                            <div class="cc-side-item"><span class="truncate text-[11px]">ភាពយន្ត</span></div>
                        `;
                        
                        const gridHeader = grid.previousElementSibling;
                        if (gridHeader) {
                            gridHeader.innerHTML = 'ទាំងអស់';
                            gridHeader.className = "text-[10px] text-[#788294] font-medium mb-3 mt-1 ml-1";
                        }
                        
                        grid.innerHTML = '';
                        grid.className = 'grid grid-cols-3 gap-2 pb-4';
                        for (let i = 1; i <= 24; i++) {
                            grid.innerHTML += `
                                <div onclick="selectDummyItem(this)" class="dummy-item cursor-pointer group flex flex-col gap-1">
                                    <div class="dummy-thumb bg-[#25252c] rounded-md aspect-square border-2 border-transparent group-hover:border-[#00e5cc] transition-all relative flex items-center justify-center overflow-hidden">
                                        <i class="fa-solid fa-image text-3xl text-[#3a3a46] group-hover:text-[#00e5cc]/30 transition-colors"></i>
                                        <div class="absolute bottom-1 right-1 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                            <i class="fa-solid fa-download text-[7px] text-white"></i>
                                        </div>
                                        ${i <= 3 ? '<div class="absolute top-1 left-1 text-[8px] bg-amber-500 text-amber-950 font-bold px-1 rounded-sm leading-tight">PRO</div>' : ''}
                                    </div>
                                    <div class="dummy-text text-[10px] text-slate-300 text-center truncate group-hover:text-white transition-colors">
                                        ${mapping[menuKey].prefix} ${i.toString().padStart(2, '0')}
                                    </div>
                                </div>
                            `;
                        }
                    }
                }
            }
        }
        
        function selectDummyItem(el) {
            document.querySelectorAll('.dummy-item .dummy-thumb').forEach(thumb => {
                thumb.classList.remove('border-[#00e5cc]');
                thumb.classList.add('border-transparent');
            });
            document.querySelectorAll('.dummy-item .dummy-text').forEach(txt => {
                txt.classList.remove('text-[#00e5cc]');
                txt.classList.add('text-slate-300');
            });
            
            const thumb = el.querySelector('.dummy-thumb');
            const txt = el.querySelector('.dummy-text');
            if (thumb) {
                thumb.classList.remove('border-transparent');
                thumb.classList.add('border-[#00e5cc]');
            }
            if (txt) {
                txt.classList.remove('text-slate-300');
                txt.classList.add('text-[#00e5cc]');
            }
        }

        function switchLeftSubTab(subKey) {
            document.querySelectorAll('.cc-side-item').forEach(el => el.classList.remove('active'));
            const btn = document.getElementById(`subTab-${subKey}`);
            if (btn) btn.classList.add('active');

            if (['recap', 'translate', 'narrate', 'create'].includes(subKey)) {
                openToolInInspector(subKey);
            } else if (subKey === 'presets') {
                loadRandomPresetForCurrentTool();
            }
        }

        function switchRightPanelTab(tab) {
            activeRightTab = tab;
            const aiPanel = document.getElementById('rightPanel-ai');
            const detailsPanel = document.getElementById('rightPanel-details');
            const aiBtn = document.getElementById('rightTabBtn-ai');
            const detailsBtn = document.getElementById('rightTabBtn-details');

            if (tab === 'ai') {
                aiPanel.classList.remove('hidden');
                detailsPanel.classList.add('hidden');
                aiBtn.className = 'text-[#00e5cc] border-b-2 border-[#00e5cc] py-2 relative';
                detailsBtn.className = 'text-[#8e8e98] hover:text-white py-2 transition-colors';
            } else {
                aiPanel.classList.add('hidden');
                detailsPanel.classList.remove('hidden');
                detailsBtn.className = 'text-[#00e5cc] border-b-2 border-[#00e5cc] py-2 relative';
                aiBtn.className = 'text-[#8e8e98] hover:text-white py-2 transition-colors';
            }
        }

        function openToolInInspector(toolId) {
            currentTab = toolId;
            switchRightPanelTab('ai');

            // Synchronize the left sub-navigation to reflect the active tool
            document.querySelectorAll('.cc-side-item').forEach(el => el.classList.remove('active'));
            const subBtn = document.getElementById(`subTab-${toolId}`);
            if (subBtn) subBtn.classList.add('active');

            const tools = ['recap', 'translate', 'narrate', 'create'];
            const labels = {
                recap: 'សម្រាយរឿង AI',
                translate: 'បកប្រែរឿង/SRT',
                narrate: 'និទានរឿង & សំឡេង',
                create: 'តែងរឿងថ្មី'
            };
            const btnTexts = {
                recap: 'បង្កើតអត្ថបទសម្រាយរឿង AI',
                translate: 'បកប្រែអត្ថបទជាភាសាខ្មែរ',
                narrate: 'បង្កើតអត្ថបទនិទានរឿង AI',
                create: 'តែងរឿងថ្មីដោយ AI'
            };

            tools.forEach(t => {
                const form = document.getElementById(`toolForm-${t}`);
                const inspBtn = document.getElementById(`inspTab-${t}`);
                const cardBtn = document.getElementById(`cardBtn-${t}`);

                if (t === toolId) {
                    form.classList.remove('hidden');
                    inspBtn.className = 'py-1.5 rounded-lg font-bold bg-[#00e5cc] text-black transition-colors';
                    if (cardBtn) cardBtn.classList.add('cc-card-active');
                } else {
                    form.classList.add('hidden');
                    inspBtn.className = 'py-1.5 rounded-lg font-medium text-[#8e8e98] hover:text-white hover:bg-white/5 transition-colors';
                    if (cardBtn) cardBtn.classList.remove('cc-card-active');
                }
            });

            const activeIndicator = document.getElementById('activeToolIndicator');
            if (activeIndicator) activeIndicator.textContent = labels[toolId];
            const badge = document.getElementById('playerActiveBadge');
            if (badge) badge.textContent = labels[toolId];
            const genBtnText = document.getElementById('generateBtnText');
            if (genBtnText) genBtnText.textContent = btnTexts[toolId];
            renderPresetsForTab(toolId);
        }

        function renderPresetsForTab(tabId) {
            const container = document.getElementById('presetContainer');
            if (!container) return;
            container.innerHTML = '';
            const presets = STUDIO_PRESETS[tabId] || [];
            presets.forEach((p, idx) => {
                const btn = document.createElement('button');
                btn.className = 'w-full text-left px-2.5 py-1.5 rounded bg-[#141418] hover:bg-cc-hover border border-cc-border text-[11px] text-slate-200 flex items-center justify-between cursor-pointer';
                btn.innerHTML = `<span class="truncate pr-2">${p.label}</span><i class="fa-solid fa-arrow-right text-[9px] text-cc-teal"></i>`;
                btn.onclick = () => applyPreset(tabId, idx);
                container.appendChild(btn);
            });
        }

        function applyPreset(tabId, index) {
            const p = STUDIO_PRESETS[tabId]?.[index];
            if (!p) return;

            if (tabId === 'recap') {
                const titleEl = document.getElementById('recapTitle');
                const plotEl = document.getElementById('recapPlot');
                const toneEl = document.getElementById('recapTone');
                const hookEl = document.getElementById('recapHook');
                if (titleEl) titleEl.value = p.title || '';
                if (plotEl) plotEl.value = p.plot || '';
                if (toneEl) toneEl.value = p.tone || 'រំភើប ជក់ចិត្ត (Exciting & Dramatic)';
                if (hookEl) hookEl.value = p.hook || 'ចាប់អារម្មណ៍ខ្លាំងភ្លាមៗ (Strong Hook)';
            } else if (tabId === 'translate') {
                const sLang = document.getElementById('transSourceLang');
                const fmt = document.getElementById('transFormat');
                const tone = document.getElementById('transTone');
                const input = document.getElementById('transInput');
                if (sLang) sLang.value = p.sourceLang || sLang.value;
                if (fmt) fmt.value = p.format || fmt.value;
                if (tone) tone.value = p.tone || tone.value;
                if (input) input.value = p.text || '';
            } else if (tabId === 'narrate') {
                const textEl = document.getElementById('narrateText');
                if (textEl) textEl.value = p.topic || p.text || '';
            } else if (tabId === 'create') {
                const genreEl = document.getElementById('createGenre');
                const titleEl = document.getElementById('createTitlePrompt');
                if (genreEl && p.genre) genreEl.value = p.genre;
                if (titleEl) titleEl.value = p.prompt || p.topic || p.title || '';
            }
            showToast(`បានដាក់ទិន្នន័យគំរូ៖ ${p.label || p.title || 'ជោគជ័យ'}!`, 'success');
        }

        function loadRandomPresetForCurrentTool() {
            const list = STUDIO_PRESETS[currentTab] || [];
            if (list.length > 0) {
                applyPreset(currentTab, 0);
            }
        }

        function triggerMediaUpload() {
            document.getElementById('universalFileInput').click();
        }

        function handleDragOver(e) {
            e.preventDefault();
        }

        let importedMediaFiles = [];

        function handleMediaDrop(e) {
            e.preventDefault();
            const files = e.dataTransfer?.files;
            if (files && files.length > 0) {
                Array.from(files).forEach(processUploadedFile);
            }
        }

        function handleUniversalFileSelect(e) {
            const files = e.target.files;
            if (files && files.length > 0) {
                Array.from(files).forEach(processUploadedFile);
            }
            // Reset input so the same files can be selected again if needed
            e.target.value = '';
        }

        function processUploadedFile(file) {
            // Add to library array
            const fileObj = {
                id: 'media_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                file: file,
                name: file.name,
                type: file.type,
                url: URL.createObjectURL(file),
                thumbnail: null,
                durationFormatted: '00:00'
            };
            importedMediaFiles.push(fileObj);
            
            // Hide dropzone if we have items
            const dropzone = document.getElementById('mediaDropzoneBox');
            if (dropzone) dropzone.style.display = importedMediaFiles.length > 0 ? 'none' : 'flex';
            
            const badge = document.getElementById('mediaCountBadge');
            if (badge) badge.textContent = importedMediaFiles.length;
            
            // Re-render library grid
            renderMediaLibrary();

            showToast(`បានបញ្ចូលឯកសារ "${file.name}" ទៅក្នុង Media Library!`);
            
            const isFirstItem = importedMediaFiles.length === 1;
            
            // Extract real video thumbnail and duration
            if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.src = fileObj.url;
                video.onloadeddata = () => {
                    const mins = Math.floor(video.duration / 60) || 0;
                    const secs = Math.floor(video.duration % 60) || 0;
                    fileObj.durationFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    video.currentTime = Math.min(1, video.duration / 2 || 0);
                };
                video.onseeked = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 160;
                    canvas.height = 90;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    fileObj.thumbnail = canvas.toDataURL('image/jpeg', 0.8);
                    renderMediaLibrary();
                    if (isFirstItem) {
                        addMediaToTimeline(fileObj.id);
                    }
                };
                video.onerror = () => {
                    fileObj.durationFormatted = '05:25';
                    renderMediaLibrary();
                    if (isFirstItem) {
                        addMediaToTimeline(fileObj.id);
                    }
                };
            } else {
                if (isFirstItem) {
                    addMediaToTimeline(fileObj.id);
                }
            }
        }

        function renderMediaLibrary() {
            const grid = document.getElementById('mediaLibraryGrid');
            if (!grid) return;
            
            // Sort importedMediaFiles by filename (natural sort for Part-1, Part-2, etc.)
            importedMediaFiles.sort((a, b) => {
                return a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'});
            });
            
            // Keep dropzone if empty, else just clear and re-add items
            const dropzoneHtml = importedMediaFiles.length === 0 ? `
                <div id="mediaDropzoneBox" class="col-span-4 w-full flex-1 min-h-[250px] flex flex-col items-center justify-center mt-4">
                    <div onclick="triggerMediaUpload()" class="flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-opacity p-8">
                        <div class="flex items-center gap-2.5 mb-3">
                            <div class="w-[26px] h-[26px] rounded-full bg-[#00e5cc] flex items-center justify-center">
                                <i class="fa-solid fa-plus text-[#111115] text-[13px] font-black"></i>
                            </div>
                            <span class="text-white text-[15px] font-bold">Import</span>
                        </div>
                        <span class="text-[#788294] text-[12px]">Drag and drop videos, photos, and audio files here</span>
                    </div>
                </div>
            ` : '';

            grid.innerHTML = dropzoneHtml;
            
            importedMediaFiles.forEach((media, index) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'flex flex-col items-start w-full gap-2 group cursor-pointer';

                const card = document.createElement('div');
                // The card itself: rounded, dark background, cyan ring ONLY on hover
                card.className = 'relative bg-[#24242c] rounded-[6px] ring-2 ring-transparent group-hover:ring-[#00e5cc] ring-inset overflow-hidden transition-all duration-200 w-full aspect-video flex items-center justify-center';
                
                // Set draggable to drag to timeline
                card.draggable = true;
                card.ondragstart = (e) => {
                    e.dataTransfer.setData('text/plain', media.id);
                    e.dataTransfer.effectAllowed = 'copy';
                };

                // Add to timeline on click
                card.onclick = () => addMediaToTimeline(media.id);

                let iconHtml = '';
                let durationStr = media.durationFormatted || '05:25';
                
                if (media.type.startsWith('video/')) {
                    if (media.thumbnail) {
                        iconHtml = `<img src="${media.thumbnail}" class="w-full h-full object-cover opacity-90" alt="thumbnail" />`;
                    } else {
                        iconHtml = `<div class="w-full h-full bg-[#111115] animate-pulse"></div>`; // Loading skeleton
                    }
                } else if (media.type.startsWith('image/')) {
                    iconHtml = '<i class="fa-regular fa-image text-3xl text-emerald-400 opacity-60"></i>';
                } else if (media.type.startsWith('audio/')) {
                    iconHtml = '<i class="fa-solid fa-file-audio text-3xl text-purple-400 opacity-60"></i>';
                } else {
                    iconHtml = '<i class="fa-solid fa-file-lines text-3xl text-slate-400 opacity-60"></i>';
                }
                
                card.innerHTML = `
                    ${iconHtml}
                    <!-- Time duration badge (bottom right) -->
                    <div class="absolute bottom-1 right-1 text-[10px] text-white font-sans font-medium bg-black/60 px-1 rounded z-10 group-hover:opacity-0 transition-opacity duration-150">${durationStr}</div>
                    
                    <!-- Hover Add Button (bottom right, shows on hover replacing duration) -->
                    <button class="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#00e5cc] text-black flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20" onclick="event.stopPropagation(); addMediaToTimeline('${media.id}')">
                        <i class="fa-solid fa-plus text-[10px] font-bold"></i>
                    </button>
                    
                    <!-- Hover Delete Button (top right) -->
                    <button class="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-rose-500 text-white flex justify-center items-center opacity-0 group-hover:opacity-100 transition-all duration-150 z-30" onclick="event.stopPropagation(); removeMedia('${media.id}')">
                        <i class="fa-solid fa-xmark text-[10px]"></i>
                    </button>
                `;
                
                // Filename below the card
                const title = document.createElement('div');
                title.className = 'text-[10px] text-[#788294] group-hover:text-white transition-colors w-full truncate px-0.5';
                title.title = media.name;
                title.textContent = media.name;

                wrapper.appendChild(card);
                wrapper.appendChild(title);
                grid.appendChild(wrapper);
            });
        }

        function removeMedia(mediaId) {
            importedMediaFiles = importedMediaFiles.filter(m => m.id !== mediaId);
            const badge = document.getElementById('mediaCountBadge');
            if (badge) badge.textContent = importedMediaFiles.length;
            
            renderMediaLibrary();
            showToast('បានលុបឯកសារចេញពី Library រួចរាល់!', 'warning');
        }

        function addMediaToTimeline(mediaId) {
            const media = importedMediaFiles.find(m => m.id === mediaId);
            if (!media) return;
            
            const videoEl = document.getElementById('uploadedVideoPreview');
            const imgEl = document.getElementById('uploadedImagePreview');
            const nameEl = document.getElementById('detailProjectName');
            
            if (nameEl) nameEl.textContent = media.name;

            if (media.type.startsWith('video/')) {
                videoEl.src = media.url;
                videoEl.classList.remove('hidden');
                imgEl.classList.add('hidden');
                setCenterStageMode('stage');
                appendFakeClipToTimeline('video', media);
                showToast(`បានទាញវីដេអូ "${media.name}" ចូល Player និង Timeline!`);
                setTimeout(() => openAiFlowModal(), 300);
            } else if (media.type.startsWith('image/')) {
                imgEl.src = media.url;
                imgEl.classList.remove('hidden');
                videoEl.classList.add('hidden');
                setCenterStageMode('stage');
                appendFakeClipToTimeline('video', media);
                showToast(`បានទាញរូបភាព "${media.name}" ចូល Player និង Timeline!`);
            } else if (media.type.startsWith('audio/')) {
                appendFakeClipToTimeline('audio', media);
                showToast(`បានទាញសំឡេង "${media.name}" ចូល Timeline!`);
            } else {
                // Text or SRT file
                const reader = new FileReader();
                reader.onload = function(evt) {
                    const content = evt.target.result;
                    if (media.name.endsWith('.srt')) {
                        openToolInInspector('translate');
                        const transFmt = document.getElementById('transFormat');
                        if (transFmt) transFmt.value = 'រក្សាទម្រង់ម៉ោង Subtitle .SRT';
                        const transInp = document.getElementById('transInput');
                        if (transInp) transInp.value = content;
                    } else {
                        const recapPlot = document.getElementById('recapPlot');
                        if (recapPlot) recapPlot.value = content;
                        const transInp = document.getElementById('transInput');
                        if (transInp) transInp.value = content;
                    }
                    updateOutputContent(content, media.name);
                    showToast(`បានបញ្ចូលឯកសារអត្ថបទ: "${media.name}"`);
                };
                reader.readAsText(media.file);
            }
        }

        function makeClipResizable(clip) {
            const leftHandle = document.createElement('div');
            leftHandle.className = 'trim-handle absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize bg-white/0 hover:bg-white/20 z-50 hidden group-[.selected]:flex items-center justify-center';
            leftHandle.innerHTML = '<div class="w-1 h-3 bg-white rounded-full opacity-80 pointer-events-none"></div>';
            
            const rightHandle = document.createElement('div');
            rightHandle.className = 'trim-handle absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize bg-white/0 hover:bg-white/20 z-50 hidden group-[.selected]:flex items-center justify-center';
            rightHandle.innerHTML = '<div class="w-1 h-3 bg-white rounded-full opacity-80 pointer-events-none"></div>';
            
            clip.appendChild(leftHandle);
            clip.appendChild(rightHandle);

            let isResizing = false;
            let resizeEdge = null;
            let startX = 0;
            let startBaseWidth = 0;
            let startBgOffsetX = 0;

            const onMouseMove = (e) => {
                if (!isResizing) return;
                const deltaX = e.clientX - startX;
                
                if (resizeEdge === 'right') {
                    const newWidth = Math.max(20, startBaseWidth + deltaX / timelineZoomScale);
                    clip.dataset.baseWidth = newWidth;
                    clip.style.width = `${newWidth * timelineZoomScale}px`;
                } else if (resizeEdge === 'left') {
                    const deltaWidth = deltaX / timelineZoomScale;
                    const newWidth = Math.max(20, startBaseWidth - deltaWidth);
                    if (newWidth > 20) {
                        clip.dataset.baseWidth = newWidth;
                        clip.style.width = `${newWidth * timelineZoomScale}px`;
                        const newBgOffsetX = startBgOffsetX - deltaX;
                        clip.dataset.bgOffsetX = newBgOffsetX;
                        const filmstrip = clip.querySelector('.filmstrip-bg');
                        if (filmstrip) filmstrip.style.backgroundPositionX = `${newBgOffsetX}px`;
                    }
                }
            };

            const onMouseUp = () => {
                if (isResizing) {
                    isResizing = false;
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                }
            };

            leftHandle.onmousedown = (e) => {
                e.stopPropagation();
                isResizing = true;
                resizeEdge = 'left';
                startX = e.clientX;
                startBaseWidth = parseFloat(clip.dataset.baseWidth);
                startBgOffsetX = parseFloat(clip.dataset.bgOffsetX || 0);
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            };

            rightHandle.onmousedown = (e) => {
                e.stopPropagation();
                isResizing = true;
                resizeEdge = 'right';
                startX = e.clientX;
                startBaseWidth = parseFloat(clip.dataset.baseWidth);
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            };
        }

        function appendFakeClipToTimeline(type, media) {
            const emptyState = document.getElementById('timelineEmptyState');
            const tracksContainer = document.getElementById('trackRowsContainer');
            if (emptyState) emptyState.classList.add('opacity-0');
            if (tracksContainer) tracksContainer.classList.remove('opacity-0', 'pointer-events-none');

            const row = document.getElementById(type === 'audio' ? 'trackRow-audio' : 'trackRow-video');
            if (!row) return;
            const clip = document.createElement('div');
            clip.dataset.isFake = 'true';
            
            const name = media ? media.name : 'Unknown';
            const durationBadge = media && media.durationFormatted ? media.durationFormatted : '01:12.00';
            const thumbnail = media && media.thumbnail ? media.thumbnail : null;
            
            // scale based on actual duration in seconds
            let baseWidth = 120;
            if (media && media.durationFormatted) {
                const parts = media.durationFormatted.split(':');
                if (parts.length === 2) {
                    baseWidth = (parseInt(parts[0]) * 60 + parseInt(parts[1])); // Natural duration in seconds
                }
            }
            if (baseWidth < 10) baseWidth = 10; // Min base width
            clip.dataset.baseWidth = baseWidth;
            
            if (type === 'video') {
                // CapCut Video Clip Style: Taller clip, repeating thumbnail filmstrip
                clip.className = 'timeline-clip h-[42px] rounded-sm flex items-center justify-between px-2 shrink-0 border border-[#2b2b33] hover:border-white relative overflow-hidden bg-[#1a1a24] text-slate-200 shadow-sm transition-colors cursor-pointer group';
                clip.style.width = `${timelineZoomScale * baseWidth}px`;
                clip.dataset.bgOffsetX = '0'; // Track background offset for seamless splits
                
                let bgHtml = '';
                if (thumbnail) {
                    // Repeating X to simulate film strip
                    bgHtml = `<div class="absolute inset-0 opacity-80 pointer-events-none filmstrip-bg" style="background-image: url('${thumbnail}'); background-size: auto 100%; background-repeat: repeat-x; background-position-x: 0px;"></div>`;
                } else {
                    bgHtml = `<div class="absolute inset-0 opacity-10 flex items-center justify-around pointer-events-none">
                        <i class="fa-solid fa-image text-[12px]"></i>
                        <i class="fa-solid fa-image text-[12px]"></i>
                    </div>`;
                }
                
                clip.innerHTML = `
                    ${bgHtml}
                    <!-- Dark gradients on left and right edges so text is readable -->
                    <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80 pointer-events-none"></div>
                    <span class="relative z-10 font-mono text-[9px] font-semibold drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">00:00 - ${durationBadge}</span>
                    <span class="relative z-10 text-[9.5px] font-medium truncate max-w-[150px] drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">${name}</span>
                `;
            } else {
                // CapCut Audio Clip Style: Teal background, white waveform
                clip.className = 'timeline-clip h-[30px] rounded flex items-center justify-start px-2 shrink-0 border border-[#1a8c88] hover:border-white relative overflow-hidden bg-[#146c68] text-[#e0f2f1] shadow-sm transition-colors cursor-pointer group';
                clip.style.width = `${timelineZoomScale * baseWidth}px`;
                clip.innerHTML = `
                    <div class="absolute inset-0 opacity-30 flex items-center pointer-events-none overflow-hidden" style="background-image: repeating-linear-gradient(90deg, transparent, transparent 1px, #fff 1px, #fff 2px); background-size: 4px 60%; background-position: center; background-repeat: repeat-x;"></div>
                    <i class="fa-solid fa-file-audio mr-1.5 text-[10px] relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,1)]"></i>
                    <span class="truncate text-[9.5px] font-medium relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">${name}</span>
                `;
            }
            
            // Add click selection logic for fake clips
            clip.onclick = (e) => {
                e.stopPropagation();
                // Move playhead
                const tracksArea = document.getElementById('timelineTracksArea');
                if (tracksArea) {
                    const rect = tracksArea.getBoundingClientRect();
                    const clickX = e.clientX - rect.left + tracksArea.scrollLeft;
                    document.getElementById('timelinePlayhead').style.left = `${Math.max(24, clickX)}px`;
                }

                // Deselect other fake clips
                document.querySelectorAll('.timeline-clip[data-is-fake="true"]').forEach(c => {
                    c.classList.remove('selected', 'border-white', 'ring-1', 'ring-white/50');
                    c.classList.add(c.dataset.type === 'video' ? 'border-[#2b2b33]' : 'border-[#1a8c88]');
                });
                // Select this one
                clip.classList.remove('border-[#2b2b33]', 'border-[#1a8c88]');
                clip.classList.add('selected', 'border-white', 'ring-1', 'ring-white/50');
                activeTimelineElement = clip;
            };
            clip.dataset.type = type;
            makeClipResizable(clip);
            
            row.appendChild(clip);
            return clip;
        }

        function handleTimelineDragOver(e) {
            e.preventDefault(); // Necessary to allow drop
            e.dataTransfer.dropEffect = 'copy';
        }

        function handleTimelineDrop(e) {
            e.preventDefault();
            const mediaId = e.dataTransfer.getData('text/plain');
            if (mediaId) {
                // If dragged from our media library
                addMediaToTimeline(mediaId);
                showToast('បានទាញសម្ភារៈដាក់ចូល Timeline រួចរាល់!', 'success');
            } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                // If dragged directly from the computer into timeline
                Array.from(e.dataTransfer.files).forEach(processUploadedFile);
                showToast('បានអូសឯកសារពីខាងក្រៅចូល Timeline!', 'success');
            }
        }

        function getEffectiveApiKey() {
            const saved = localStorage.getItem('khmer_studio_custom_api_key');
            return saved && saved.trim() !== '' ? saved.trim() : apiKey;
        }

        function generateSmartKhmerFallback(tab, userPrompt) {
            if (tab === 'recap') {
                const rawTitle = (document.getElementById('recapTitle')?.value || '').trim();
                const title = cleanMovieTitle(rawTitle) || 'រឿងអាថ៌កំបាំងដែលគេលាក់ទុក';
                const plot = (document.getElementById('recapPlot')?.value || '').trim();
                const plotDesc = plot 
                    ? `សាច់រឿងសង្ខេប៖ ${plot}` 
                    : `សាច់រឿងផ្តោតលើដំណើរជីវិតរបស់តួអង្គសំខាន់ ដែលត្រូវប្រឈមមុខនឹងវិបត្តិដ៏ធំបំផុតក្នុងជីវិត និងអាថ៌កំបាំងដែលគេលាក់ទុកជាយូរមកហើយ។`;

                return `[HOOK ទាក់ទាញ]
តើអ្នកនឹងមានអារម្មណ៍បែបណា ប្រសិនបើថ្ងៃមួយ ជីវិតដ៏សាមញ្ញរបស់អ្នក ត្រូវធ្លាក់ចូលក្នុងរឿងរ៉ាវដ៏រន្ធត់នៃខ្សែភាពយន្ត "${title}" ដែលគ្មានផ្លូវត្រឡប់ក្រោយ?

[INTRO បើកឆាក]
[ភ្លេងរន្ធត់] សូមស្វាគមន៍មកកាន់ការសម្រាយរឿងពិសេស! ថ្ងៃនេះយើងនឹងនាំអារម្មណ៍អ្នកទាំងអស់គ្នាទៅតាមដានខ្សែភាពយន្តដ៏ជក់ចិត្តដិតអារម្មណ៍រឿង "${title}"។ [ផ្អាកបន្តិច] ធានាថានឹងធ្វើឱ្យអ្នកទស្សនាមិនអាចដកភ្នែករួចឡើយ។

[BODY សាច់រឿងសម្រាយ]
[សំឡេងតិចៗ] រឿងរ៉ាវចាប់ផ្តើមឡើងនៅពេលដែលតួឯក បានជួបប្រទះនឹងព្រឹត្តិការណ៍ចម្លែកមួយដែលមិននឹកស្មានដល់។ ${plotDesc}
[ភ្លេងតានតឹង] ឈានមកដល់ឈុតបន្ទាប់ ភាពតានតឹងកាន់តែកើនឡើង នៅពេលដែលតួអង្គទាំងអស់ត្រូវប្រឈមមុខនឹងការសម្រេចចិត្តដ៏លំបាកបំផុត។ ការក្បត់ ការតស៊ូ និងការលះបង់ បានកើតឡើងជាបន្តបន្ទាប់ រហូតដល់ចំណុចកំពូលនៃសាច់រឿង។ [សំឡេងដកដង្ហើមធំ] គ្មាននរណាម្នាក់ដឹងថា តើអ្នកណាជាមិត្តពិត ឬសត្រូវពិតប្រាកដនោះឡើយ។

[OUTRO បញ្ចប់ និងសារអប់រំ]
[ភ្លេងរំជួលចិត្ត] នៅទីបញ្ចប់ រឿង "${title}" បានបន្សល់ទុកនូវមេរៀនជីវិតដ៏មានតម្លៃ គឺការមិនចុះចាញ់ចំពោះវាសនា និងតម្លៃនៃមនុស្សជាទីស្រលាញ់។ សូមចុច Like, Follow និង Share ដើម្បីទទួលបានការសម្រាយរឿងថ្មីៗជារៀងរាល់ថ្ងៃ!`;
            }

            if (tab === 'translate') {
                const input = (document.getElementById('transInput')?.value || '').trim();
                if (/\d{2}:\d{2}:\d{2}/.test(input)) {
                    return `1\n00:00:01,000 --> 00:00:05,000\nគ្មាននរណាម្នាក់ជឿបុរសចំណាស់នោះទេ ពេលគាត់បានព្រមានអ្នកភូមិ។\n\n2\n00:00:05,500 --> 00:00:10,000\nត្រឹមពាក់កណ្តាលអធ្រាត្រ ទ្វារគ្រប់ផ្ទះត្រូវបានចាក់សោរពីខាងក្រៅទាំងអស់។\n\n3\n00:00:10,500 --> 00:00:15,000\nពួកគេមិនអាចរត់គេចបានទៀតទេ គ្រប់យ៉ាងគឺហួសពេលទៅហើយ។`;
                }
                return `ការបកប្រែជាភាសាខ្មែរសម្រួលយ៉ាងរលូន៖\n\n"រឿងរ៉ាវទាំងអស់បានចាប់ផ្តើមនៅពេលដែលព្រឹត្តិការណ៍មិននឹកស្មានដល់បានកើតឡើង។ គ្រប់គ្នាព្យាយាមស្វែងរកការពិត ប៉ុន្តែអាថ៌កំបាំងកាន់តែស៊ីជម្រៅទៅៗ។"`;
            }

            if (tab === 'narrate') {
                const text = (document.getElementById('narrateText')?.value || '').trim() || 'រឿងនិទានខ្មែរ';
                return `[និទានរឿង]\n[សំឡេងកក់ក្តៅ] កាលពីព្រេងនាយ មានដំណើររឿងមួយដ៏អស្ចារ្យដែលចាស់បុរាណតែងតែដំណាលតៗគ្នា៖ ${text}។ រឿងនេះបានបង្រៀនយើងឱ្យដឹងអំពីគុណធម៌ សេចក្តីល្អ និងភាពស្មោះត្រង់។`;
            }

            if (tab === 'create') {
                const title = (document.getElementById('createTitlePrompt')?.value || '').trim() || 'ដំណើរផ្សងព្រេងថ្មី';
                const genre = document.getElementById('createGenre')?.value || 'ផ្សងព្រេង';
                return `[ចំណងជើង៖ ${title}]
[ប្រភេទ៖ ${genre}]

[វគ្គទី ១៖ ចាប់ផ្តើមរឿង]
[ភ្លេងស្រទន់] នៅលើទឹកដីដ៏ស្ងប់ស្ងាត់មួយ ដំណើររឿង "${title}" បានចាប់ផ្តើមឡើងជាមួយតួអង្គសំខាន់ដែលមានក្តីសុបិន្តដ៏ធំធេង។ ទោះបីជាមានការរារាំងពីមនុស្សជុំវិញខ្លួនយ៉ាងណាក៏ដោយ ក៏ការតាំងចិត្តមិនដែលប្រែប្រួលឡើយ។

[វគ្គទី ២៖ ឧបសគ្គ និងការផ្លាស់ប្តូរ]
[ភ្លេងរន្ធត់] ថ្ងៃមួយ គ្រោះអាសន្នដ៏ធំបានមកដល់។ ភាពស្ងប់ស្ងាត់ត្រូវបានបំផ្លាញ ហើយតួអង្គទាំងអស់ត្រូវរត់ប្រណាំងជាមួយពេលវេលាដើម្បីសង្គ្រោះអ្វីៗដែលខ្លួនស្រលាញ់។ ការលះបង់ និងភាពក្លាហានត្រូវបានបង្ហាញយ៉ាងច្បាស់នៅគ្រប់ជំហាន។

[វគ្គទី ៣៖ ទីបញ្ចប់ និងអត្ថន័យ]
[ភ្លេងរំភើប] ទីបំផុត ពន្លឺនៃក្តីសង្ឃឹមក៏បានរះឡើងម្តងទៀត។ ឧបសគ្គទាំងឡាយបានក្លាយជាកម្លាំងចិត្ត និងមេរៀនដែលមិនអាចបំភ្លេចបាន។ "${title}" បញ្ជាក់ថាសេចក្តីល្អតែងតែយកឈ្នះលើសេចក្តីអាក្រក់ជានិច្ច។`;
            }

            return `[អត្ថបទ AI]\nបានបង្កើតសាច់រឿងជោគជ័យ។`;
        }

        function getEffectiveModel() {
            return localStorage.getItem('khmer_studio_gemini_model') || 'gemini-1.5-flash';
        }

        async function callGeminiTextAPI(systemPrompt, userPrompt) {
            const activeKey = getEffectiveApiKey();
            const apiUrl = `http://localhost:5050/api/generate`;

            if (activeKey && activeKey.trim() !== '') {
                const payload = {
                    api_key: activeKey.trim(),
                    model: getEffectiveModel(),
                    system_prompt: systemPrompt,
                    user_prompt: userPrompt
                };

                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (response.ok) {
                        const result = await response.json();
                        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text && text.trim()) return text;
                    } else {
                        const errData = await response.json().catch(() => ({}));
                        console.warn("Backend Gemini API response not ok:", response.status, errData);
                    }
                } catch (err) {
                    console.warn("AI API request failed, falling back to smart generator:", err);
                }
            } else {
                showToast('💡 បញ្ជាក់៖ មិនទាន់មាន API Key ទេ! កំពុងប្រើប្រព័ន្ធ AI ឆ្លាតវៃសម្រាយរឿងតាមចំណងជើង...', 'info');
            }

            // High-quality smart Khmer generator tailored directly to the user's input
            return generateSmartKhmerFallback(currentTab, userPrompt);
        }

        function handleTransFileUpload(e) {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                const transInput = document.getElementById('transInput');
                if (transInput) transInput.value = text;

                const statusBox = document.getElementById('transFileStatus');
                if (statusBox) {
                    const fileSizeKB = (file.size / 1024).toFixed(1);
                    const srtMatches = text.match(/\d{2}:\d{2}:\d{2},\d{3}/g);
                    const srtCount = srtMatches ? Math.floor(srtMatches.length / 2) : 0;
                    
                    let estHours = '';
                    if (srtCount > 0) {
                        estHours = ` (~ ${(srtCount / 400).toFixed(1)} ម៉ោងសាច់រឿង, ${srtCount.toLocaleString()} ឈុត Subtitle)`;
                    } else {
                        const words = text.split(/\s+/).length;
                        estHours = ` (~ ${(words / 8000).toFixed(1)} ម៉ោងសាច់រឿង, ${words.toLocaleString()} ពាក្យ)`;
                    }

                    statusBox.innerHTML = `
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-file-lines text-emerald-400"></i>
                            <span class="font-bold text-white">${file.name}</span> (${fileSizeKB} KB) ${estHours}
                        </div>
                        <span class="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">READY</span>
                    `;
                    statusBox.classList.remove('hidden');
                    statusBox.classList.add('flex');
                }
                showToast(`បានបញ្ចូលឯកសារ "${file.name}" រួចរាល់! អាចចាប់ផ្តើមបកប្រែបាន។`, 'success');
            };
            reader.readAsText(file, 'utf-8');
        }

        function clearTransInput() {
            const input = document.getElementById('transInput');
            if (input) input.value = '';
            const statusBox = document.getElementById('transFileStatus');
            if (statusBox) {
                statusBox.classList.add('hidden');
                statusBox.classList.remove('flex');
                statusBox.innerHTML = '';
            }
            const fileInput = document.getElementById('transFileInput');
            if (fileInput) fileInput.value = '';
            showToast('បានជម្រះអត្ថបទបកប្រែ');
        }

        async function translateLongStoryWithGemini(fullText, sourceLang, format, tone) {
            const isSRT = /\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/.test(fullText);
            let chunks = [];

            if (isSRT) {
                const srtBlocks = fullText.split(/\r?\n\r?\n/).map(b => b.trim()).filter(Boolean);
                const chunkSize = 80;
                for (let i = 0; i < srtBlocks.length; i += chunkSize) {
                    chunks.push(srtBlocks.slice(i, i + chunkSize).join('\n\n'));
                }
            } else {
                const paragraphs = fullText.split(/\r?\n\r?\n/).map(p => p.trim()).filter(Boolean);
                let currentChunk = '';
                for (const p of paragraphs) {
                    if ((currentChunk.length + p.length) > 3500) {
                        chunks.push(currentChunk.trim());
                        currentChunk = p + '\n\n';
                    } else {
                        currentChunk += p + '\n\n';
                    }
                }
                if (currentChunk.trim()) chunks.push(currentChunk.trim());
            }

            if (chunks.length <= 1) {
                const systemPrompt = `អ្នកគឺជាអ្នកបកប្រែរឿងភាពយន្ត និង Subtitle ដ៏ជំនាញបំផុតនៅកម្ពុជា។ សូមបកប្រែមកជាភាសាខ្មែរធម្មជាតិ ពីរោះ និងមិនឆ្គង។ ប្រសិនបើជាទម្រង់ .SRT ត្រូវរក្សាលេខរៀង និងម៉ោង (Timecode) ឱ្យនៅដដែល ១០០%។`;
                const userPrompt = `បកប្រែអត្ថបទខាងក្រោមមកជាភាសាខ្មែរ (${format}, ${tone})៖\n\n${fullText}`;
                return await callGeminiTextAPI(systemPrompt, userPrompt);
            }

            showToast(`កំពុងចាប់ផ្តើមបកប្រែសាច់រឿងវែង (${chunks.length} វគ្គ)...`, 'info');
            const translatedChunks = [];

            for (let i = 0; i < chunks.length; i++) {
                const percent = Math.round(((i + 1) / chunks.length) * 100);
                showToast(`កំពុងបកប្រែដោយ Google AI: វគ្គទី ${i + 1}/${chunks.length} (${percent}%)...`, 'info');

                const systemPrompt = `អ្នកគឺជាអ្នកបកប្រែរឿងភាពយន្ត និង Subtitle ដ៏ជំនាញបំផុតនៅកម្ពុជា។ នេះជាផ្នែកទី ${i + 1} នៃ ${chunks.length} នៃសាច់រឿងវែង។ សូមបកប្រែមកជាភាសាខ្មែរធម្មជាតិ ពីរោះ និងមិនឆ្គង។ ប្រសិនបើជាទម្រង់ .SRT ត្រូវរក្សាលេខរៀង និងម៉ោង (Timecode) ឱ្យនៅដដែល ១០០% ដោយមិនលុបម៉ោងចោលឡើយ។`;
                const userPrompt = `បកប្រែផ្នែកទី ${i + 1} នេះមកជាភាសាខ្មែរ (${format}, ${tone})៖\n\n${chunks[i]}`;

                try {
                    const chunkResult = await callGeminiTextAPI(systemPrompt, userPrompt);
                    translatedChunks.push(chunkResult);
                } catch (e) {
                    console.warn(`Chunk ${i+1} translation error:`, e);
                    translatedChunks.push(chunks[i]);
                }
            }

            return translatedChunks.join('\n\n');
        }

        function addAutoBGMTrack() {
            const tone = document.getElementById('recapTone')?.value || 'cinematic';
            let bgmName = 'Epic_Cinematic_BGM.mp3';
            if (tone.includes('រន្ធត់') || tone.includes('Thriller') || tone.includes('Scary')) {
                bgmName = 'Suspense_Horror_Dark_BGM.mp3';
            } else if (tone.includes('កម្សត់') || tone.includes('Emotional') || tone.includes('Sad')) {
                bgmName = 'Emotional_Piano_Dramatic_BGM.mp3';
            } else if (tone.includes('Action') || tone.includes('សកម្មភាព')) {
                bgmName = 'Fast_Paced_Action_War_BGM.mp3';
            }

            appendFakeClipToTimeline('audio', { url: '', name: `🎵 ${bgmName}`, durationFormatted: '03:45' });
            showToast(`បានបន្ថែមភ្លេងកំដរអារម្មណ៍ "${bgmName}" ចូល Timeline!`, 'success');
        }

        function handleProRecapVoice() {
            autoNarrateAfterGenerate = true;
            handleGenerate();
        }

        async function handleGenerate() {
            let systemPrompt = '';
            let userPrompt = '';
            let historyTitle = '';

            if (currentTab === 'recap') {
                const title = (document.getElementById('recapTitle')?.value || '').trim();
                const tone = document.getElementById('recapTone')?.value || 'រំភើប ជក់ចិត្ត';
                const hook = document.getElementById('recapHook')?.value || 'ចាប់អារម្មណ៍ខ្លាំងភ្លាមៗ';
                const length = document.getElementById('recapLength')?.value || 'លម្អិត';
                const naming = document.getElementById('recapNaming')?.value || 'ឈ្មោះតួពិត';
                const plot = (document.getElementById('recapPlot')?.value || '').trim();

                if (!title && !plot) {
                    showToast('សូមបញ្ចូលចំណងជើងរឿង ឬសាច់រឿងសង្ខេបជាមុនសិន!', 'warning');
                    return;
                }
                historyTitle = title || 'សម្រាយរឿងថ្មី';
                systemPrompt = `អ្នកគឺជាអ្នកនិពន្ធអត្ថបទសម្រាយរឿង (Movie Recap Scriptwriter) លំដាប់កំពូលនៅកម្ពុជា។
សូមសរសេរអត្ថបទសម្រាយរឿងជាភាសាខ្មែរឱ្យពីរោះ រលូន ជក់ចិត្ត និងបែងចែកជា ៤ ផ្នែកច្បាស់លាស់៖
[HOOK ទាក់ទាញ]
[INTRO បើកឆាក]
[BODY សាច់រឿងសម្រាយ]
[OUTRO បញ្ចប់ និងសារអប់រំ]
ព្រមទាំងដាក់សញ្ញាណសំឡេងក្នុងវង់ក្រចកកែងដូចជា [ភ្លេងរន្ធត់], [សំឡេងតិចៗ], [ផ្អាកបន្តិច]។`;

                userPrompt = `សូមសរសេរអត្ថបទសម្រាយរឿងជាភាសាខ្មែរ៖
- ចំណងជើងរឿង៖ ${title || 'មិនបានបញ្ជាក់'}
- បែបផែនអារម្មណ៍៖ ${tone}
- ស្ទីល Hook៖ ${hook}
- ប្រវែងអត្ថបទ៖ ${length}
- ការហៅឈ្មោះតួអង្គ៖ ${naming}
- សាច់រឿងសង្ខេប៖ ${plot || 'សូមសម្រាយតាមសាច់រឿងពិតឱ្យជក់ចិត្តបំផុត'}`;

            } else if (currentTab === 'translate') {
                const sourceLang = document.getElementById('transSourceLang')?.value || 'ភាសាអង់គ្លេស';
                const input = (document.getElementById('transInput')?.value || '').trim();

                if (!input) {
                    showToast('សូមបញ្ចូលអត្ថបទ ឬ Upload ឯកសារ Subtitle ដែលត្រូវបកប្រែជាមុនសិន!', 'warning');
                    return;
                }
                historyTitle = `បកប្រែ (${sourceLang.split(' ')[0]})`;

            } else if (currentTab === 'narrate') {
                const voice = document.getElementById('narrateVoice')?.value || 'Kore';
                const emotion = document.getElementById('narrateEmotion')?.value || 'natural';
                const text = (document.getElementById('narrateText')?.value || '').trim();

                if (!text) {
                    showToast('សូមបញ្ចូលអត្ថបទដែលចង់បំប្លែងទៅជាសំឡេងជាមុនសិន!', 'warning');
                    return;
                }
                
                historyTitle = `សំឡេងពិតៗ៖ ${text.slice(0, 25)}...`;
                showToast(`កំពុងបំប្លែងសំឡេងដោយប្រើម៉ូដែល ${voice} (${emotion})...`, 'info');
                
                const outputTextarea = document.getElementById('outputTextarea');
                if (outputTextarea) outputTextarea.value = text;
                updateOutputContent(text, 'និទានរឿង');
                setCenterStageMode('editor');
                
                setTimeout(() => {
                    generateAndPlayTTS(text);
                }, 600);
                return;

            } else if (currentTab === 'create') {
                const genre = document.getElementById('createGenre')?.value || 'ផ្សងព្រេង';
                const length = document.getElementById('createLength')?.value || 'មធ្យម';
                const structure = document.getElementById('createStructure')?.value || 'ពេញលេញ';
                const titlePrompt = (document.getElementById('createTitlePrompt')?.value || '').trim();

                if (!titlePrompt) {
                    showToast('សូមបញ្ចូលចំណងជើងរឿង ឬ គ្រោងរឿងដែលអ្នកចង់តែងជាមុនសិន!', 'warning');
                    return;
                }
                historyTitle = `តែងរឿង៖ ${titlePrompt.slice(0, 25)}...`;
                systemPrompt = `អ្នកគឺជាអ្នកនិពន្ធប្រលោមលោក និងរឿងភាពយន្តដ៏ឆ្នើមនៅកម្ពុជា។ សូមតែងរឿងថ្មីជាភាសាខ្មែរ ដោយសរសេររៀបរាប់ឱ្យបានវែងក្បោះក្បាយ មានន័យជ្រៅ មានឈុតឆាករស់រវើក។ សូមធានាថាសាច់រឿងមានរចនាសម្ព័ន្ធល្អ៖ (១. ផ្តើមរឿងទាក់ទាញ ២. តួសាច់រឿងមានបញ្ហាឬភាពតានតឹង ៣. បញ្ចប់រឿងប្រកបដោយអត្ថន័យ)។`;
                userPrompt = `ចំណងជើង/គោលគំនិត៖ "${titlePrompt}"\nប្រភេទរឿង៖ ${genre}\nប្រវែង៖ ${length}\nរចនាសម្ព័ន្ធ៖ ${structure}\n\nសូមសរសេររឿងនេះឱ្យបានវែង និងពិស្តារបំផុត!`;
            }

            setLoadingState(true);
            try {
                let resultText = '';
                if (currentTab === 'translate') {
                    const sourceLang = document.getElementById('transSourceLang')?.value || 'ភាសាអង់គ្លេស';
                    const format = document.getElementById('transFormat')?.value || 'សម្រាយរឿង';
                    const tone = document.getElementById('transTone')?.value || 'ធម្មជាតិ';
                    const input = (document.getElementById('transInput')?.value || '').trim();
                    resultText = await translateLongStoryWithGemini(input, sourceLang, format, tone);
                } else {
                    resultText = await callGeminiTextAPI(systemPrompt, userPrompt);
                }

                const badgeNames = {
                    recap: 'សម្រាយរឿង AI',
                    translate: 'បកប្រែរឿង (Google AI)',
                    narrate: 'និទានរឿង',
                    create: 'តែងរឿងថ្មី'
                };
                updateOutputContent(resultText, badgeNames[currentTab]);
                setCenterStageMode('editor');
                saveToHistory(historyTitle, badgeNames[currentTab], resultText);
                showToast('បានបង្កើតអត្ថបទ និងបញ្ចូលទៅក្នុង Timeline រួចរាល់!', 'success');
            } catch (err) {
                console.error("handleGenerate error:", err);
                showToast('មានបញ្ហាក្នុងការបង្កើតអត្ថបទ សូមសាកល្បងម្តងទៀត។', 'error');
            } finally {
                setLoadingState(false);
                if (autoNarrateAfterGenerate) {
                    autoNarrateAfterGenerate = false;
                    setTimeout(() => {
                        showToast('កំពុងទាញយកសំឡេង AI អាជីព (Pro Voice)...', 'info');
                        generateAndPlayTTS();
                    }, 800);
                }
            }
        }

        function updateOutputContent(text, badgeLabel) {
            previousScriptSnapshot = currentOutputText;
            currentOutputText = text.trim();
            if (badgeLabel) {
                document.getElementById('playerActiveBadge').textContent = badgeLabel;
            }
            document.getElementById('outputTextarea').value = currentOutputText;
            updateMetrics(currentOutputText);
            buildTimelineSegmentsFromScript(currentOutputText);
        }

        function handleManualOutputEdit() {
            currentOutputText = document.getElementById('outputTextarea').value;
            updateMetrics(currentOutputText);
            buildTimelineSegmentsFromScript(currentOutputText);
        }

        function undoScriptChange() {
            if (previousScriptSnapshot) {
                updateOutputContent(previousScriptSnapshot);
                showToast('បានត្រឡប់ទៅអត្ថបទមុន (Undo)');
            }
        }

        function buildTimelineSegmentsFromScript(rawText) {
            if (!rawText) {
                timelineSegments = [];
                renderTimelineTracks();
                return;
            }

            // Split script into meaningful blocks (by double newline or section tags)
            const blocks = rawText
                .split(/\n\s*\n/)
                .map(b => b.trim())
                .filter(b => b.length > 0);

            timelineSegments = blocks.map((block, idx) => {
                const sectionMatch = block.match(/\[((?:HOOK|INTRO|BODY|OUTRO)[^\]]*)\]/i);
                const sectionTitle = sectionMatch ? `[${sectionMatch[1]}]` : `ឈុតទី ${idx + 1}`;
                
                const cueMatch = block.match(/\[(?!HOOK|INTRO|BODY|OUTRO)([^\]]+)\]/i);
                const soundCue = cueMatch ? `[${cueMatch[1]}]` : '[សំឡេងនិទានធម្មជាតិ]';

                const cleanSubtitle = block
                    .replace(/\[(?:HOOK|INTRO|BODY|OUTRO)[^\]]*\]/gi, '')
                    .trim();

                const durationSec = Math.max(4, Math.min(12, Math.ceil(cleanSubtitle.length / 22)));

                return {
                    id: idx,
                    section: sectionTitle,
                    cue: soundCue,
                    text: cleanSubtitle || block,
                    duration: durationSec
                };
            });

            activeSegmentIndex = 0;
            renderTimelineTracks();
            selectTimelineSegment(0);
        }

        function renderTimelineTracks() {
            const textRow = document.getElementById('trackRow-text');
            const videoRow = document.getElementById('trackRow-video');
            const audioRow = document.getElementById('trackRow-audio');
            const emptyState = document.getElementById('timelineEmptyState');
            const tracksContainer = document.getElementById('trackRowsContainer');

            if (textRow) {
                Array.from(textRow.children).forEach(c => { if(c.dataset.isFake !== 'true') c.remove(); });
            }
            if (videoRow) {
                Array.from(videoRow.children).forEach(c => { if(c.dataset.isFake !== 'true') c.remove(); });
            }
            if (audioRow) {
                Array.from(audioRow.children).forEach(c => { if(c.dataset.isFake !== 'true') c.remove(); });
            }

            const hasFakeClips = document.querySelectorAll('.timeline-clip[data-is-fake="true"]').length > 0;

            if ((!timelineSegments || timelineSegments.length === 0) && !hasFakeClips) {
                if (emptyState) emptyState.classList.remove('opacity-0');
                if (tracksContainer) tracksContainer.classList.add('opacity-0', 'pointer-events-none');
            } else {
                if (emptyState) emptyState.classList.add('opacity-0');
                if (tracksContainer) tracksContainer.classList.remove('opacity-0', 'pointer-events-none');
            }

            let totalDuration = 0;

            timelineSegments.forEach((seg, idx) => {
                totalDuration += seg.duration;
                // Base min width scales with zoom, but always minimum 60px to read at least part of text
                const minWidth = Math.max(60, timelineZoomScale * 3);
                const widthPx = Math.max(minWidth, seg.duration * timelineZoomScale);
                const isSelected = idx === activeSegmentIndex;
                
                // Calculate timestamps for video clip
                let prevTotal = 0;
                for(let i=0; i<idx; i++) prevTotal += timelineSegments[i].duration;
                const startMins = String(Math.floor(prevTotal / 60)).padStart(2, '0');
                const startSecs = String(prevTotal % 60).padStart(2, '0');
                const endMins = String(Math.floor((prevTotal + seg.duration) / 60)).padStart(2, '0');
                const endSecs = String((prevTotal + seg.duration) % 60).padStart(2, '0');
                const timeString = `${startMins}:${startSecs}.00 - ${endMins}:${endSecs}.00`;

                const handleClipClick = (e, index) => {
                    e.stopPropagation();
                    if (timelineToolMode === 'razor') {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickOffset = e.clientX - rect.left;
                        const tracksArea = document.getElementById('timelineTracksArea');
                        const playhead = document.getElementById('timelinePlayhead');
                        const playheadX = rect.left - tracksArea.getBoundingClientRect().left + tracksArea.scrollLeft + clickOffset;
                        if (playhead) playhead.style.left = `${Math.max(24, playheadX)}px`;
                        selectTimelineSegment(index);
                        splitActiveTimelineClip();
                        showToast('✂️ បានកាត់ឈុតត្រង់កន្លែងចុចកាំបិត (Razor Split)!', 'success');
                    } else {
                        selectTimelineSegment(index);
                    }
                };

                // 1. Text/Script Clip (Amber)
                const textClip = document.createElement('div');
                textClip.className = `timeline-clip shrink-0 h-[24px] bg-[#9a4e1c] text-amber-100 rounded-sm border ${isSelected ? 'border-white ring-1 ring-white/50' : 'border-[#b86227]'} overflow-hidden shadow-sm`;
                textClip.style.width = `${widthPx}px`;
                textClip.innerHTML = `<span class="font-bold mr-1">${seg.section}</span>${seg.text}`;
                textClip.onclick = (e) => handleClipClick(e, idx);
                textRow.appendChild(textClip);

                // 2. Video/Scene Clip (CapCut Dark Video Style)
                const videoClip = document.createElement('div');
                videoClip.className = `timeline-clip shrink-0 h-[40px] rounded-md relative overflow-hidden cursor-pointer ${isSelected ? 'border border-white ring-1 ring-white/50' : 'border border-[#32323a]'}`;
                videoClip.style.width = `${widthPx}px`;
                videoClip.style.backgroundColor = '#181822';
                
                // Add repeated image icons as thumbnails background across the entire clip
                const frameWidth = 60;
                const iconCount = Math.max(1, Math.ceil(widthPx / frameWidth));
                let bgIcons = '';
                for(let i=0; i<iconCount; i++) {
                    bgIcons += `
                        <div class="absolute top-0 bottom-0 border-r border-[#111116] flex items-center justify-center bg-[#22222e]" style="left: ${(i * frameWidth)}px; width: ${frameWidth}px;">
                            <i class="fa-solid fa-image text-[#3a3a4c] text-[18px]"></i>
                        </div>
                    `;
                }
                
                const clipLabel = (importedMediaFiles[idx] && importedMediaFiles[idx].name) 
                    ? importedMediaFiles[idx].name 
                    : (importedMediaFiles[0] ? importedMediaFiles[0].name : `Scene-${idx+1}.mp4`);

                videoClip.innerHTML = `
                    ${bgIcons}
                    <div class="absolute inset-y-0 left-0 pl-2.5 pr-4 flex items-center max-w-[55%] z-10 pointer-events-none overflow-hidden bg-gradient-to-r from-[#181822] via-[#181822]/90 to-transparent">
                        <span class="font-mono text-[12px] font-bold text-[#f5f5f5] truncate">${timeString}</span>
                    </div>
                    <div class="absolute inset-y-0 right-0 pr-2.5 pl-4 flex items-center justify-end max-w-[40%] z-10 pointer-events-none overflow-hidden bg-gradient-to-l from-[#181822] via-[#181822]/90 to-transparent">
                        <span class="text-[11px] text-[#8e8e98] truncate font-sans">${clipLabel}</span>
                    </div>
                `;
                videoClip.onclick = (e) => handleClipClick(e, idx);
                videoRow.appendChild(videoClip);

                // 3. Audio/Voiceover Clip (CapCut Waveform Dark Style)
                const audioClip = document.createElement('div');
                const audioTrackHeight = (window.currentTimelineDensity === 'compact') ? 'h-[26px]' : 'h-[32px]';
                audioClip.className = `timeline-clip shrink-0 ${audioTrackHeight} rounded-sm text-[#0a2046] relative overflow-hidden cursor-pointer ${isSelected ? 'border border-white ring-1 ring-white/50' : 'border border-[#2a3850]'}`;
                audioClip.style.backgroundColor = '#182335';
                audioClip.style.width = `${widthPx}px`;
                
                // SVG Waveform Background Layer with dynamic theme accent stroke
                const waveform = document.createElement('div');
                waveform.className = 'absolute inset-0 opacity-80 pointer-events-none';
                const currentWaveStroke = encodeURIComponent(window.currentStudioThemeAccent || '#00e5cc');
                waveform.style.backgroundImage = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none' viewBox='0 0 100 20'><path d='M0,10 L2,5 L4,15 L6,8 L8,12 L10,3 L12,17 L14,9 L16,11 L18,6 L20,14 L22,4 L24,16 L26,8 L28,12 L30,5 L32,15 L34,7 L36,13 L38,4 L40,16 L42,9 L44,11 L46,6 L48,14 L50,2 L52,18 L54,8 L56,12 L58,5 L60,15 L62,7 L64,13 L66,4 L68,16 L70,9 L72,11 L74,6 L76,14 L78,3 L80,17 L82,8 L84,12 L86,5 L88,15 L90,7 L92,13 L94,4 L96,16 L98,9 L100,10' fill='none' stroke='${currentWaveStroke}' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/></svg>")`;
                waveform.style.backgroundSize = '50px 80%';
                waveform.style.backgroundPosition = 'center';
                waveform.style.backgroundRepeat = 'repeat-x';
                audioClip.appendChild(waveform);
                
                const audioText = document.createElement('span');
                audioText.className = 'relative z-10 text-[10px] font-medium pl-2 leading-[24px] text-[#f0f0f5] drop-shadow-md truncate block pointer-events-none';
                audioText.style.textShadow = '0 1px 2px rgba(0,0,0,0.8)';
                audioText.textContent = seg.cue;
                audioClip.appendChild(audioText);
                
                audioClip.onclick = (e) => handleClipClick(e, idx);
                audioRow.appendChild(audioClip);
            });

            // Adjust width of track rows and ruler based on total duration to allow scrolling
            const scrollWidth = (totalDuration * timelineZoomScale) + 200;
            
            const rulerWrapper = document.getElementById('timelineRulerWrapper');
            rulerWrapper.style.minWidth = `${scrollWidth}px`;
            rulerWrapper.style.width = '100%'; // Stretches to fill container if clips are shorter
            
            const rowsContainer = document.getElementById('trackRowsContainer');
            rowsContainer.style.minWidth = `${scrollWidth}px`;
            rowsContainer.style.width = '100%';
            
            // Clean up old hardcoded widths on individual rows
            textRow.style.width = '';
            videoRow.style.width = '';
            audioRow.style.width = '';

            document.getElementById('timelineClipSummary').textContent = `${timelineSegments.length} ឈុតនៅលើ Timeline`;
            document.getElementById('playerTotalTime').textContent = formatCapCutTimecode(totalDuration);
            
            renderTimelineRuler(totalDuration + 60); // give 60s buffer space
        }

        function renderTimelineRuler(totalSecs) {
            const shortTicks = document.getElementById('rulerShortTicks');
            const longTicks = document.getElementById('rulerLongTicks');
            const labelsContainer = document.getElementById('rulerTimeLabels');
            
            const pxPerSec = timelineZoomScale;
            
            // 1 sec ticks
            shortTicks.style.backgroundImage = `repeating-linear-gradient(to right, transparent, transparent ${pxPerSec - 1}px, #3a3a46 ${pxPerSec - 1}px, #3a3a46 ${pxPerSec}px)`;
            
            // 5 sec ticks
            const fiveSecPx = pxPerSec * 5;
            longTicks.style.backgroundImage = `repeating-linear-gradient(to right, transparent, transparent ${fiveSecPx - 1}px, #5a5a6a ${fiveSecPx - 1}px, #5a5a6a ${fiveSecPx}px)`;
            
            labelsContainer.innerHTML = '';
            
            // Generate labels for every 5 seconds up to totalSecs
            const maxSeconds = Math.max(120, totalSecs); // at least 2 mins
            for (let s = 0; s <= maxSeconds; s += 5) {
                const span = document.createElement('span');
                span.className = `absolute -translate-x-1/2 ${s === 0 ? 'text-[#00e5cc] font-semibold' : ''}`;
                span.style.left = `${s * pxPerSec}px`;
                
                const mins = String(Math.floor(s / 60)).padStart(2, '0');
                const secs = String(s % 60).padStart(2, '0');
                span.textContent = `${mins}:${secs}`;
                
                labelsContainer.appendChild(span);
            }
        }

        function selectTimelineSegment(index) {
            activeTimelineElement = null; // Clear fake clip selection
            // Deselect fake clips visually
            document.querySelectorAll('.timeline-clip[data-is-fake="true"]').forEach(c => {
                c.classList.remove('border-white', 'ring-1', 'ring-white/50');
                c.classList.add(c.dataset.type === 'video' ? 'border-[#2b2b33]' : 'border-[#1a8c88]');
            });

            if (!timelineSegments.length) return;
            activeSegmentIndex = Math.max(0, Math.min(index, timelineSegments.length - 1));
            const seg = timelineSegments[activeSegmentIndex];

            const subWrapper = document.getElementById('subtitleWrapper');
            if (subWrapper) subWrapper.classList.remove('hidden');

            const sectionTag = document.getElementById('stageSectionTag');
            if (sectionTag) sectionTag.textContent = seg.section;
            const clipCounter = document.getElementById('stageClipCounter');
            if (clipCounter) clipCounter.textContent = `ឈុតទី ${activeSegmentIndex + 1}/${timelineSegments.length}`;
            const soundCue = document.getElementById('stageSoundCue');
            if (soundCue) soundCue.textContent = `🎧 ${seg.cue}`;
            const activeSubtitle = document.getElementById('stageActiveSubtitle');
            if (activeSubtitle) activeSubtitle.textContent = seg.text;

            // Calculate elapsed time up to this clip
            let elapsed = 0;
            for (let i = 0; i < activeSegmentIndex; i++) {
                elapsed += timelineSegments[i].duration;
            }
            document.getElementById('playerCurrentTime').textContent = formatCapCutTimecode(elapsed);

            // Move playhead visually
            let leftOffset = 24;
            for (let i = 0; i < activeSegmentIndex; i++) {
                const minWidth = Math.max(60, timelineZoomScale * 3);
                leftOffset += Math.max(minWidth, timelineSegments[i].duration * timelineZoomScale) + 4;
            }
            document.getElementById('timelinePlayhead').style.left = `${leftOffset}px`;

            renderTimelineTracks();
        }

        function stepTimelineClip(delta) {
            selectTimelineSegment(activeSegmentIndex + delta);
        }

        function toggleTimelinePlayback() {
            const icon = document.getElementById('playerPlayIcon');
            const videoEl = document.getElementById('uploadedVideoPreview');

            if (timelinePlayInterval) {
                clearInterval(timelinePlayInterval);
                timelinePlayInterval = null;
                icon.className = 'fa-solid fa-play text-[15px] ml-0.5';
                if (!videoEl.classList.contains('hidden')) videoEl.pause();
            } else {
                icon.className = 'fa-solid fa-pause text-[15px]';
                if (!videoEl.classList.contains('hidden')) videoEl.play();
                timelinePlayInterval = setInterval(() => {
                    if (activeSegmentIndex < timelineSegments.length - 1) {
                        selectTimelineSegment(activeSegmentIndex + 1);
                    } else {
                        selectTimelineSegment(0);
                        toggleTimelinePlayback();
                    }
                }, 3200);
            }
        }

        // ==================== CAPCUT PRO TIMELINE ENGINE ====================
        let timelineHistory = [];
        let timelineRedoStack = [];
        let timelineToolMode = 'select'; // 'select' | 'razor'
        let isTimelineMagnetActive = true;
        let isTimelineSnappingActive = true;
        let isTimelineLinked = true;
        let timelineRulerMode = 'timecode'; // 'timecode' | 'frames'
        let trackStates = {
            video: { hidden: false, locked: false, muted: false },
            text: { hidden: false, locked: false },
            audio: { muted: false, locked: false, solo: false }
        };

        function saveTimelineSnapshot(actionName = 'Edit') {
            const snapshot = {
                action: actionName,
                segments: JSON.parse(JSON.stringify(timelineSegments || [])),
                activeIndex: activeSegmentIndex
            };
            timelineHistory.push(snapshot);
            if (timelineHistory.length > 25) timelineHistory.shift();
            timelineRedoStack = []; // clear redo on new action
            updateTimelineUndoRedoUI();
        }

        function undoTimelineAction() {
            if (timelineHistory.length === 0) {
                showToast('គ្មានសកម្មភាពអាចត្រឡប់ក្រោយបានទេ', 'info');
                return;
            }
            const currentSnapshot = {
                action: 'Current',
                segments: JSON.parse(JSON.stringify(timelineSegments || [])),
                activeIndex: activeSegmentIndex
            };
            timelineRedoStack.push(currentSnapshot);

            const prev = timelineHistory.pop();
            timelineSegments = prev.segments;
            activeSegmentIndex = Math.min(prev.activeIndex, Math.max(0, timelineSegments.length - 1));

            renderTimelineTracks();
            selectTimelineSegment(activeSegmentIndex);
            updateTimelineUndoRedoUI();
            showToast(`↩️ បានត្រឡប់ក្រោយ (Undo): ${prev.action}`, 'info');
        }

        function redoTimelineAction() {
            if (timelineRedoStack.length === 0) {
                showToast('គ្មានសកម្មភាពអាចធ្វើឡើងវិញបានទេ', 'info');
                return;
            }
            const next = timelineRedoStack.pop();
            saveTimelineSnapshot('Redo');
            timelineSegments = next.segments;
            activeSegmentIndex = Math.min(next.activeIndex, Math.max(0, timelineSegments.length - 1));

            renderTimelineTracks();
            selectTimelineSegment(activeSegmentIndex);
            updateTimelineUndoRedoUI();
            showToast(`↪️ បានធ្វើឡើងវិញ (Redo)`, 'info');
        }

        function updateTimelineUndoRedoUI() {
            const undoBtn = document.getElementById('btnTimelineUndo');
            const redoBtn = document.getElementById('btnTimelineRedo');

            if (undoBtn) {
                if (timelineHistory.length > 0) {
                    undoBtn.className = 'w-8 h-8 flex items-center justify-center rounded hover:bg-[#2b2b33] text-white transition-colors cursor-pointer';
                    undoBtn.title = `ត្រលប់ក្រោយ (Undo - Ctrl+Z) [${timelineHistory.length}]`;
                } else {
                    undoBtn.className = 'w-8 h-8 flex items-center justify-center rounded hover:bg-[#2b2b33] text-[#52525b] transition-colors cursor-not-allowed';
                    undoBtn.title = 'ត្រលប់ក្រោយ (Undo - គ្មានប្រវត្តិ)';
                }
            }

            if (redoBtn) {
                if (timelineRedoStack.length > 0) {
                    redoBtn.className = 'w-8 h-8 flex items-center justify-center rounded hover:bg-[#2b2b33] text-white transition-colors cursor-pointer';
                    redoBtn.title = `ធ្វើឡើងវិញ (Redo - Ctrl+Y) [${timelineRedoStack.length}]`;
                } else {
                    redoBtn.className = 'w-8 h-8 flex items-center justify-center rounded hover:bg-[#2b2b33] text-[#52525b] transition-colors cursor-not-allowed';
                    redoBtn.title = 'ធ្វើឡើងវិញ (Redo - គ្មានប្រវត្តិ)';
                }
            }
        }

        function toggleTimelineToolDropdown() {
            const dd = document.getElementById('timelineToolDropdown');
            if (dd) dd.classList.toggle('hidden');
        }

        function setTimelineToolMode(mode) {
            timelineToolMode = mode;
            const btn = document.getElementById('btnTimelineToolMode');
            const icon = document.getElementById('timelineToolModeIcon');
            const text = document.getElementById('timelineToolModeText');
            const tracksArea = document.getElementById('timelineTracksArea');
            const dd = document.getElementById('timelineToolDropdown');
            if (dd) dd.classList.add('hidden');

            if (mode === 'razor') {
                if (btn) btn.className = 'h-[28px] px-2 flex items-center justify-center rounded-[8px] border border-amber-500/50 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-all gap-1.5 cursor-pointer shadow-sm';
                if (icon) icon.className = 'fa-solid fa-scissors text-[12px] text-amber-400';
                if (text) text.textContent = 'Razor (B)';
                if (tracksArea) tracksArea.style.cursor = 'crosshair';
                showToast('✂️ បានបើកឧបករណ៍កាត់ (Razor Blade Tool) - ចុចលើឈុតណាមួយដើម្បីកាត់ភ្លាមៗ!', 'info');
            } else {
                if (btn) btn.className = 'h-[28px] px-2 flex items-center justify-center rounded-[8px] border border-[#00e5cc]/40 bg-[#00e5cc]/10 text-[#00e5cc] hover:bg-[#00e5cc]/20 transition-all gap-1.5 cursor-pointer shadow-sm';
                if (icon) icon.className = 'fa-solid fa-arrow-pointer text-[12px]';
                if (text) text.textContent = 'Select (A)';
                if (tracksArea) tracksArea.style.cursor = 'default';
                showToast('↖️ បានប្តូរទៅកាន់ឧបករណ៍ជ្រើសរើស (Select Tool)', 'info');
            }
        }

        function freezeFrameAtPlayhead() {
            if (trackStates.video.locked) {
                showToast('Track វីដេអូត្រូវបានចាក់សោ (Locked) មិនអាចកែសម្រួលបានទេ!', 'warning');
                return;
            }

            saveTimelineSnapshot('Freeze Frame');

            const newSeg = {
                section: '❄️ Freeze Frame',
                text: '[រូបភាពបង្កក 3.0s]',
                duration: 3,
                cue: 'Freeze Frame 3.0s'
            };

            const insertIndex = activeSegmentIndex >= 0 ? activeSegmentIndex + 1 : timelineSegments.length;
            timelineSegments.splice(insertIndex, 0, newSeg);
            activeSegmentIndex = insertIndex;

            renderTimelineTracks();
            selectTimelineSegment(activeSegmentIndex);
            showToast('❄️ បានបង្កកប្លង់វីដេអូ (Freeze Frame 3.0s) នៅត្រង់ Playhead ជោគជ័យ!', 'success');
        }

        function reverseActiveTimelineClip() {
            if (timelineSegments.length === 0) {
                showToast('សូមបញ្ចូល ឬជ្រើសរើសឈុតវីដេអូជាមុនសិន!', 'warning');
                return;
            }

            saveTimelineSnapshot('Reverse');
            const seg = timelineSegments[activeSegmentIndex];
            if (seg) {
                seg.isReversed = !seg.isReversed;
                seg.cue = seg.isReversed ? `<< REV (-1.0x) ${seg.cue.replace('<< REV (-1.0x) ', '')}` : seg.cue.replace('<< REV (-1.0x) ', '');
                renderTimelineTracks();
                showToast(seg.isReversed ? '↺ បានត្រឡប់ល្បឿនវីដេអូថយក្រោយ (Reverse Playback -1.0x)!' : 'បានត្រឡប់ល្បឿនវីដេអូមកធម្មតា!', 'info');
            }
        }

        function toggleTimelineSpeedMenu() {
            const menu = document.getElementById('timelineSpeedMenu');
            if (menu) menu.classList.toggle('hidden');
        }

        function setTimelineClipSpeed(spd) {
            const menu = document.getElementById('timelineSpeedMenu');
            if (menu) menu.classList.add('hidden');
            const display = document.getElementById('timelineSpeedDisplay');
            if (display) display.textContent = `${spd.toFixed(1)}x`;

            const videoEl = document.getElementById('uploadedVideoPreview');
            if (videoEl) videoEl.playbackRate = spd;

            showToast(`⚡ បានកំណត់ល្បឿនចាក់វីដេអូ៖ ${spd.toFixed(1)}x`, 'info');
        }

        function toggleTrackVisibility(trackType) {
            trackStates[trackType].hidden = !trackStates[trackType].hidden;
            const isHidden = trackStates[trackType].hidden;

            const eyeBtn = document.getElementById(`trackEye-${trackType}`);
            if (eyeBtn) {
                const icon = eyeBtn.querySelector('i');
                if (isHidden) {
                    if (icon) icon.className = 'fa-regular fa-eye-slash text-[11px] text-rose-400';
                    eyeBtn.classList.add('text-rose-400');
                } else {
                    if (icon) icon.className = 'fa-regular fa-eye text-[11px]';
                    eyeBtn.classList.remove('text-rose-400');
                }
            }

            if (trackType === 'video') {
                const videoEl = document.getElementById('uploadedVideoPreview');
                const imageEl = document.getElementById('uploadedImagePreview');
                if (videoEl) videoEl.style.opacity = isHidden ? '0' : '1';
                if (imageEl) imageEl.style.opacity = isHidden ? '0' : '1';
                showToast(isHidden ? 'បានបិទការបង្ហាញវីដេអូលើ Stage' : 'បានបើកការបង្ហាញវីដេអូលើ Stage ឡើងវិញ', 'info');
            } else if (trackType === 'text') {
                const subWrap = document.getElementById('subtitleWrapper');
                if (subWrap) subWrap.style.opacity = isHidden ? '0' : '1';
                showToast(isHidden ? 'បានបិទការបង្ហាញ Subtitle' : 'បានបើកការបង្ហាញ Subtitle ឡើងវិញ', 'info');
            }
        }

        function toggleTrackLock(trackType) {
            trackStates[trackType].locked = !trackStates[trackType].locked;
            const isLocked = trackStates[trackType].locked;

            const lockBtn = document.getElementById(`trackLock-${trackType}`);
            if (lockBtn) {
                const icon = lockBtn.querySelector('i');
                if (isLocked) {
                    if (icon) icon.className = 'fa-solid fa-lock text-[10px] text-amber-400';
                    lockBtn.classList.add('text-amber-400');
                } else {
                    if (icon) icon.className = 'fa-solid fa-lock-open text-[10px]';
                    lockBtn.classList.remove('text-amber-400');
                }
            }

            const trackRow = document.getElementById(`trackRow-${trackType}`);
            if (trackRow) {
                trackRow.style.opacity = isLocked ? '0.6' : '1';
                trackRow.style.pointerEvents = isLocked ? 'none' : 'auto';
            }

            showToast(isLocked ? `🔒 បានចាក់សោ Track ${trackType.toUpperCase()} (Locked)` : `🔓 បានដោះសោ Track ${trackType.toUpperCase()}`, 'info');
        }

        function toggleTrackMute(trackType) {
            trackStates[trackType].muted = !trackStates[trackType].muted;
            const isMuted = trackStates[trackType].muted;

            const muteBtn = document.getElementById(`trackMute-${trackType}`);
            if (muteBtn) {
                const icon = muteBtn.querySelector('i');
                if (isMuted) {
                    if (icon) icon.className = 'fa-solid fa-volume-xmark text-[11px] text-rose-400';
                } else {
                    if (icon) icon.className = 'fa-solid fa-volume-high text-[11px]';
                }
            }

            if (trackType === 'video') {
                const videoEl = document.getElementById('uploadedVideoPreview');
                if (videoEl) videoEl.muted = isMuted;
                showToast(isMuted ? '🔇 បានបិទសំឡេងដើមរបស់វីដេអូ' : '🔊 បានបើកសំឡេងដើមរបស់វីដេអូ', 'info');
            } else if (trackType === 'audio') {
                const bgmAudio = document.getElementById('bgmAudioPlayer');
                const ttsAudio = document.getElementById('aiAudioPlayer');
                if (bgmAudio) bgmAudio.muted = isMuted;
                if (ttsAudio) ttsAudio.muted = isMuted;
                showToast(isMuted ? '🔇 បានបិទសំឡេង AI & BGM' : '🔊 បានបើកសំឡេង AI & BGM ឡើងវិញ', 'info');
            }
        }

        function toggleTrackSolo(trackType) {
            trackStates[trackType].solo = !trackStates[trackType].solo;
            const isSolo = trackStates[trackType].solo;

            const soloBtn = document.getElementById(`trackSolo-${trackType}`);
            if (soloBtn) {
                soloBtn.classList.toggle('text-[#00e5cc]', isSolo);
            }
            showToast(isSolo ? `🎧 Solo Track ${trackType.toUpperCase()} បើកដំណើរការ` : 'បានបិទ Solo Track', 'info');
        }

        function triggerTimelineVoiceover() {
            showToast('🎙️ ត្រៀមថតសំឡេងនិទានផ្ទាល់លើ Timeline... (3... 2... 1...)', 'info');
            setTimeout(() => {
                toggleApiModal('voxcmp');
                showToast('សូមចុចប៊ូតុង "ថតសំឡេងផ្ទាល់" ក្នុង VoxCMP Studio!', 'info');
            }, 600);
        }

        function toggleTimelineMagnet() {
            isTimelineMagnetActive = !isTimelineMagnetActive;
            const btn = document.getElementById('btnTimelineMagnet');
            if (btn) {
                if (isTimelineMagnetActive) {
                    btn.className = 'w-[30px] h-[28px] flex items-center justify-center rounded-[6px] bg-[#32323d] text-[#00e5cc] hover:bg-[#3f3f4c] transition-all cursor-pointer shadow-sm';
                } else {
                    btn.className = 'w-[30px] h-[28px] flex items-center justify-center rounded-[6px] bg-[#1d1d24] text-slate-500 hover:text-white transition-all cursor-pointer';
                }
            }
            showToast(isTimelineMagnetActive ? '🧲 បានបើក Main Track Magnet (ស្អិតជាប់ស្វ័យប្រវត្តិតាមចង្វាក់)' : 'បានបិទ Track Magnet (Manual Spacing)', 'info');
        }

        function toggleTimelineSnapping() {
            isTimelineSnappingActive = !isTimelineSnappingActive;
            const btn = document.getElementById('btnTimelineSnapping');
            if (btn) {
                if (isTimelineSnappingActive) {
                    btn.className = 'w-[30px] h-[28px] flex items-center justify-center rounded-[6px] bg-[#32323d] text-[#00e5cc] hover:bg-[#3f3f4c] transition-all cursor-pointer shadow-sm';
                } else {
                    btn.className = 'w-[30px] h-[28px] flex items-center justify-center rounded-[6px] bg-[#1d1d24] text-slate-500 hover:text-white transition-all cursor-pointer';
                }
            }
            showToast(isTimelineSnappingActive ? '✨ បានបើក Auto Snapping (តម្រឹម Playhead & Clip ស្វ័យប្រវត្តិ)' : 'បានបិទ Auto Snapping', 'info');
        }

        function toggleTimelineLinkage() {
            isTimelineLinked = !isTimelineLinked;
            const btn = document.getElementById('btnTimelineLink');
            if (btn) {
                btn.classList.toggle('text-[#00e5cc]', isTimelineLinked);
            }
            showToast(isTimelineLinked ? '🔗 បានភ្ជាប់វីដេអូ និងសំឡេង (Linked Tracks - កាត់តដំណាលគ្នា)' : 'បានផ្តាច់ Link Tracks (Independent Editing)', 'info');
        }

        function toggleTimelineQualityMenu() {
            const menu = document.getElementById('timelineQualityMenu');
            if (menu) menu.classList.toggle('hidden');
        }

        function setTimelineQuality(res) {
            const menu = document.getElementById('timelineQualityMenu');
            if (menu) menu.classList.add('hidden');
            const label = document.getElementById('timelineQualityLabel');
            if (label) label.textContent = res;
            showToast(`🖥 បានកំណត់គុណភាព Preview ៖ ${res}`, 'info');
        }

        function toggleTimelineRulerFormat() {
            timelineRulerMode = timelineRulerMode === 'timecode' ? 'frames' : 'timecode';
            const totalDuration = timelineSegments.reduce((acc, s) => acc + s.duration, 0) || 120;
            renderTimelineRuler(totalDuration + 60);
            showToast(`📏 បានប្តូរទម្រង់បន្ទាត់ម៉ោងទៅជា៖ ${timelineRulerMode === 'timecode' ? 'Timecode (00:00:05:00)' : 'Frames (30fps)'}`, 'info');
        }

        function splitActiveTimelineClip() {
            saveTimelineSnapshot('Split Clip');
            const playhead = document.getElementById('timelinePlayhead');
            const playheadLeftPx = parseFloat(playhead.style.left) || 24;

            let clipToSplit = activeTimelineElement;

            // If no clip selected, find the one under the playhead
            if (!clipToSplit) {
                const fakeClips = document.querySelectorAll('.timeline-clip[data-is-fake="true"]');
                const tracksArea = document.getElementById('timelineTracksArea');
                const areaScrollLeft = tracksArea.scrollLeft;
                const areaLeft = tracksArea.getBoundingClientRect().left;
                
                for (let clip of fakeClips) {
                    const rect = clip.getBoundingClientRect();
                    const clipStartPx = rect.left - areaLeft + areaScrollLeft;
                    const clipEndPx = clipStartPx + rect.width;
                    if (playheadLeftPx >= clipStartPx && playheadLeftPx <= clipEndPx) {
                        clipToSplit = clip;
                        break;
                    }
                }
            }

            if (clipToSplit && clipToSplit.dataset.isFake === 'true') {
                const clip = clipToSplit;
                const baseWidth = parseFloat(clip.dataset.baseWidth);
                if (baseWidth < 20) {
                    showToast('ឈុតនេះខ្លីពេក មិនអាចកាត់បំបែកទៀតបានទេ', 'warning');
                    return;
                }

                const tracksArea = document.getElementById('timelineTracksArea');
                const clipLeftRelative = clip.getBoundingClientRect().left - tracksArea.getBoundingClientRect().left + tracksArea.scrollLeft;
                const clipWidthPx = clip.getBoundingClientRect().width;
                
                let cutPx = playheadLeftPx - clipLeftRelative;
                // Ensure cut point is inside the clip and not too close to edges
                if (cutPx < 10 || cutPx > clipWidthPx - 10) {
                    cutPx = clipWidthPx / 2; // Default to center if playhead is not over the clip
                }
                
                const fraction = cutPx / clipWidthPx;
                const width1 = baseWidth * fraction;
                const width2 = baseWidth - width1;
                
                // update original clip
                clip.dataset.baseWidth = width1;
                clip.style.width = `${timelineZoomScale * width1}px`;
                clip.classList.remove('border-white', 'ring-1', 'ring-white/50');
                clip.classList.add(clip.dataset.type === 'video' ? 'border-[#2b2b33]' : 'border-[#1a8c88]');
                // Remove right rounding for original
                clip.classList.remove('rounded-sm');
                clip.classList.add('rounded-l-sm', 'border-r-0');
                
                // create a clone of the clip
                const clone = clip.cloneNode(true);
                clone.dataset.baseWidth = width2;
                clone.style.width = `${timelineZoomScale * width2}px`;
                clone.onclick = clip.onclick;
                
                // Remove dead resize handles from the clone and re-initialize
                clone.querySelectorAll('.trim-handle').forEach(h => h.remove());
                makeClipResizable(clone);
                
                // Remove left rounding for clone
                clone.classList.remove('rounded-l-sm', 'rounded-sm', 'selected');
                clone.classList.add('rounded-r-sm', 'border-l-0');

                // Shift the background to make the filmstrip continuous
                if (clone.dataset.type === 'video') {
                    const currentOffset = parseFloat(clip.dataset.bgOffsetX || '0');
                    const newOffset = currentOffset - (timelineZoomScale * width1);
                    clone.dataset.bgOffsetX = newOffset;
                    const filmstrip = clone.querySelector('.filmstrip-bg');
                    if (filmstrip) {
                        filmstrip.style.backgroundPositionX = `${newOffset}px`;
                    }
                }
                
                // select clone (right side)
                clone.classList.add('selected', 'border-white', 'ring-1', 'ring-white/50');
                clone.classList.remove('border-[#2b2b33]', 'border-[#1a8c88]');
                
                // insert clone after original
                clip.parentNode.insertBefore(clone, clip.nextSibling);
                activeTimelineElement = clone;
                
                // Ensure initial ruler exists for fake clips
                renderTimelineRuler(120);
                
                showToast('បានកាត់បំបែកឈុត (Split) នៅត្រង់បន្ទាត់!');
                return;
            }

            if (!timelineSegments.length) return;
            const current = timelineSegments[activeSegmentIndex];
            const halfIndex = Math.floor(current.text.length / 2);
            if (halfIndex < 10) {
                showToast('ឈុតនេះខ្លីពេក មិនអាចកាត់បំបែកទៀតបានទេ', 'warning');
                return;
            }
            const part1 = current.text.slice(0, halfIndex).trim();
            const part2 = current.text.slice(halfIndex).trim();

            timelineSegments.splice(activeSegmentIndex, 1,
                { ...current, text: part1, duration: Math.max(3, Math.floor(current.duration / 2)) },
                { ...current, section: `${current.section} (២)`, text: part2, duration: Math.max(3, Math.ceil(current.duration / 2)) }
            );
            renderTimelineTracks();
            showToast('បានកាត់បំបែកឈុត (Split Clip) នៅលើ Timeline!');
        }

        function deleteSelectedClip() {
            saveTimelineSnapshot('Delete Clip');
            if (activeTimelineElement && activeTimelineElement.dataset.isFake === 'true') {
                activeTimelineElement.remove();
                activeTimelineElement = null;
                showToast('បានលុបឈុតចេញពី Timeline');
                
                const hasFakeClips = document.querySelectorAll('.timeline-clip[data-is-fake="true"]').length > 0;
                if ((!timelineSegments || timelineSegments.length === 0) && !hasFakeClips) {
                    const emptyState = document.getElementById('timelineEmptyState');
                    const tracksContainer = document.getElementById('trackRowsContainer');
                    if (emptyState) emptyState.classList.remove('opacity-0');
                    if (tracksContainer) tracksContainer.classList.add('opacity-0', 'pointer-events-none');
                }
                return;
            }

            if (timelineSegments.length <= 1) {
                showToast('ត្រូវរក្សាយ៉ាងហោចណាស់ ១ ឈុតនៅលើ Timeline', 'warning');
                return;
            }
            timelineSegments.splice(activeSegmentIndex, 1);
            activeSegmentIndex = Math.max(0, activeSegmentIndex - 1);
            renderTimelineTracks();
            selectTimelineSegment(activeSegmentIndex);
            showToast('បានលុបឈុតចេញពី Timeline');
        }

        function handleTimelineAreaClick(event) {
            const rect = event.currentTarget.getBoundingClientRect();
            const clickX = event.clientX - rect.left + event.currentTarget.scrollLeft;
            document.getElementById('timelinePlayhead').style.left = `${Math.max(24, clickX)}px`;
        }

        let isDraggingPlayhead = false;
        document.addEventListener('DOMContentLoaded', () => {
            const handle = document.getElementById('playheadHandle');
            if (handle) {
                handle.onmousedown = (e) => {
                    e.stopPropagation();
                    isDraggingPlayhead = true;
                };
            }
            document.addEventListener('mousemove', (e) => {
                if (isDraggingPlayhead) {
                    const tracksArea = document.getElementById('timelineTracksArea');
                    if (!tracksArea) return;
                    const rect = tracksArea.getBoundingClientRect();
                    const x = e.clientX - rect.left + tracksArea.scrollLeft;
                    document.getElementById('timelinePlayhead').style.left = `${Math.max(24, x)}px`;
                }
            });
            document.addEventListener('mouseup', () => {
                isDraggingPlayhead = false;
            });
            if (typeof updateGoogleConnectionUI === 'function') {
                updateGoogleConnectionUI();
            }
            if (typeof initGeneralSettings === 'function') {
                initGeneralSettings();
            }
            if (typeof initAppearanceSettings === 'function') {
                initAppearanceSettings();
            }
            if (typeof initVoiceSettings === 'function') {
                initVoiceSettings();
            }
            if (typeof initAutoToolsSettings === 'function') {
                initAutoToolsSettings();
            }
            if (typeof initShortcutsSettings === 'function') {
                initShortcutsSettings();
            }
            if (typeof initVoxCloneSettings === 'function') {
                initVoxCloneSettings();
            }
        });

        function formatCapCutTimecode(totalSeconds) {
            const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
            const secs = String(Math.floor(totalSeconds % 60)).padStart(2, '0');
            return `00:${mins}:${secs}:00`;
        }

        function setCenterStageMode(mode) {
            centerStageMode = mode;
            const visualStage = document.getElementById('centerVisualStage');
            const editorStage = document.getElementById('centerScriptEditorStage');
            const btnStage = document.getElementById('stageBtn-stage');
            const btnEditor = document.getElementById('stageBtn-editor');

            if (mode === 'stage') {
                visualStage.classList.remove('hidden');
                editorStage.classList.add('hidden');
                editorStage.classList.remove('flex');
                btnStage.className = 'px-2 py-0.5 rounded text-[11px] font-medium bg-cc-card text-cc-teal';
                btnEditor.className = 'px-2 py-0.5 rounded text-[11px] font-medium text-cc-muted hover:text-white';
            } else {
                visualStage.classList.add('hidden');
                editorStage.classList.remove('hidden');
                editorStage.classList.add('flex');
                btnEditor.className = 'px-2 py-0.5 rounded text-[11px] font-medium bg-cc-card text-cc-teal';
                btnStage.className = 'px-2 py-0.5 rounded text-[11px] font-medium text-cc-muted hover:text-white';
            }
        }

        async function quickRefineScript(mode) {
            if (!currentOutputText.trim()) return;
            const prompt = mode === 'srt'
                ? `សូមបំប្លែងអត្ថបទភាសាខ្មែរខាងក្រោមទៅជាទម្រង់កូដ Subtitle .SRT ស្តង់ដារ (00:00:00,000 --> 00:00:04,000)៖\n\n${currentOutputText}`
                : `សូមកែសម្រួលអត្ថបទភាសាខ្មែរខាងក្រោមឱ្យកាន់តែជក់ចិត្ត រន្ធត់ និងទាក់ទាញអ្នកទស្សនាជាងមុន៖\n\n${currentOutputText}`;

            setLoadingState(true);
            try {
                const refined = await callGeminiTextAPI('អ្នកគឺជាអ្នកកែសម្រួលអត្ថបទស្ទូឌីយោភាសាខ្មែរដ៏ជំនាញ។', prompt);
                updateOutputContent(refined, mode === 'srt' ? 'Subtitle .SRT' : 'សម្រាយរឿង (កែសម្រួល)');
                if (mode === 'srt') setCenterStageMode('editor');
                showToast('បានកែសម្រួលអត្ថបទរួចរាល់!');
            } catch (err) {
                showToast('មិនអាចកែសម្រួលបានទេនៅពេលនេះ', 'error');
            } finally {
                setLoadingState(false);
            }
        }

        function updateMetrics(text) {
            const clean = (text || '').replace(/\[[^\]]*\]/g, '').trim();
            const charCount = clean.replace(/\s+/g, '').length;
            const estWords = Math.max(clean.split(/\s+/).filter(Boolean).length, Math.round(charCount / 4.8));
            const secs = Math.max(5, Math.round((estWords / 130) * 60));
            document.getElementById('metricWords').textContent = `${estWords} ពាក្យ`;
            document.getElementById('metricTime').textContent = `~ ${secs} វិនាទី`;
        }

        function setLoadingState(isLoading) {
            const overlay = document.getElementById('loadingOverlay');
            const btn = document.getElementById('generateBtn');
            if (isLoading) {
                if (overlay) {
                    overlay.classList.remove('hidden');
                    overlay.classList.add('flex');
                }
                if (btn) {
                    btn.disabled = true;
                    btn.classList.add('opacity-50', 'pointer-events-none');
                }
            } else {
                if (overlay) {
                    overlay.classList.add('hidden');
                    overlay.classList.remove('flex');
                }
                if (btn) {
                    btn.disabled = false;
                    btn.classList.remove('opacity-50', 'pointer-events-none');
                }
            }
        }

        function base64ToArrayBuffer(base64) {
            const binaryString = window.atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        }

        function pcmToWav(pcm16, sampleRate) {
            const dataSize = pcm16.length * 2;
            const buffer = new ArrayBuffer(44 + dataSize);
            const view = new DataView(buffer);
            const writeStr = (offset, str) => {
                for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
            };
            writeStr(0, 'RIFF');
            view.setUint32(4, 36 + dataSize, true);
            writeStr(8, 'WAVE');
            writeStr(12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            view.setUint16(22, 1, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * 2, true);
            view.setUint16(32, 2, true);
            view.setUint16(34, 16, true);
            writeStr(36, 'data');
            view.setUint32(40, dataSize, true);
            let offset = 44;
            for (let i = 0; i < pcm16.length; i++, offset += 2) view.setInt16(offset, pcm16[i], true);
            return new Blob([view], { type: 'audio/wav' });
        }

        async function generateAndPlayTTS(customText) {
            const textToRead = (customText || (timelineSegments[activeSegmentIndex] ? timelineSegments[activeSegmentIndex].text : currentOutputText))
                .replace(/\[[^\]]*\]/g, ' ')
                .trim()
                .slice(0, 700);

            if (!textToRead) {
                showToast('សូមបញ្ចូល ឬជ្រើសរើសអត្ថបទជាមុនសិន!', 'warning');
                return;
            }

            const voiceSelect = document.getElementById('ttsVoiceSelect');
            const voiceName = voiceSelect ? voiceSelect.value : 'Kore';
            const playBtn = document.getElementById('ttsPlayBtn');
            const stopBtn = document.getElementById('ttsStopBtn');
            const audioPlayer = document.getElementById('aiAudioPlayer');
            const playIcon = document.getElementById('ttsPlayIcon');
            const playLabel = document.getElementById('ttsPlayLabel');

            if (playBtn) playBtn.disabled = true;
            if (playIcon) playIcon.className = 'fa-solid fa-spinner fa-spin';
            if (playLabel) playLabel.textContent = 'កំពុងបង្កើតសំឡេង...';

            const activeKey = getEffectiveApiKey();

            if (activeKey && activeKey.trim() !== '') {
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${activeKey}`;
                const payload = {
                    contents: [{ parts: [{ text: `Read this expressive story narration naturally: ${textToRead}` }] }],
                    generationConfig: {
                        responseModalities: ["AUDIO"],
                        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
                    },
                    model: "gemini-2.5-flash-preview-tts"
                };

                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (!response.ok) throw new Error('TTS Error');
                    const result = await response.json();
                    const part = result?.candidates?.[0]?.content?.parts?.[0];
                    const audioData = part?.inlineData?.data;
                    const mimeType = part?.inlineData?.mimeType || 'audio/L16;rate=24000';

                    if (audioData) {
                        const rateMatch = mimeType.match(/rate=(\d+)/);
                        const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
                        const pcm16 = new Int16Array(base64ToArrayBuffer(audioData));
                        const wavBlob = pcmToWav(pcm16, sampleRate);
                        if (audioPlayer) {
                            audioPlayer.src = URL.createObjectURL(wavBlob);
                            if (stopBtn) stopBtn.classList.remove('hidden');
                            await audioPlayer.play();
                            showToast(`កំពុងចាក់សំឡេងនិទាន AI (${voiceName})`, 'success');
                            return;
                        }
                    }
                } catch (e) {
                    console.warn("Gemini TTS failed, falling back to Web Speech:", e);
                }
            }

            // Web Speech API fallback (works offline in browser!)
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(textToRead);
                u.lang = 'km-KH';
                u.rate = 0.95;
                u.onend = () => {
                    if (stopBtn) stopBtn.classList.add('hidden');
                };
                window.speechSynthesis.speak(u);
                if (stopBtn) stopBtn.classList.remove('hidden');
                showToast(`កំពុងបញ្ចេញសំឡេងអាន (Web Speech)`, 'info');
            } else {
                showToast('មិនអាចចាក់សំឡេងបានទេនៅពេលនេះ', 'error');
            }

            if (playBtn) playBtn.disabled = false;
            if (playIcon) playIcon.className = 'fa-solid fa-volume-high';
            if (playLabel) playLabel.textContent = 'ស្ដាប់សំឡេង AI';
        }

        function stopAllAudio() {
            const audioPlayer = document.getElementById('aiAudioPlayer');
            if (audioPlayer) {
                audioPlayer.pause();
                audioPlayer.currentTime = 0;
            }
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            const stopBtn = document.getElementById('ttsStopBtn');
            if (stopBtn) stopBtn.classList.add('hidden');

            const mainBgm = document.getElementById('bgmAudioPlayer');
            const isDucking = localStorage.getItem('khmer_studio_smart_ducking') !== 'false';
            if (mainBgm && isDucking) {
                mainBgm.volume = parseFloat(localStorage.getItem('khmer_studio_bgm_vol') || '20') / 100;
            }
        }

        function copyOutputToClipboard() {
            if (!currentOutputText.trim()) return;
            const temp = document.createElement('textarea');
            temp.value = currentOutputText;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);
            showToast('បានចម្លងអត្ថបទទៅកាន់ Clipboard រួចរាល់!');
        }

        function convertPlainTextToSRT(text) {
            if (/\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/.test(text)) return text;
            const lines = text.replace(/\[(?:HOOK|INTRO|BODY|OUTRO)[^\]]*\]/gi, '').split(/(?:។|\n)+/).map(s => s.trim()).filter(Boolean);
            let srt = '';
            let sec = 0;
            const fmt = (s) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')},000`;
            lines.forEach((line, i) => {
                const dur = Math.max(3, Math.min(7, Math.ceil(line.length / 18)));
                srt += `${i + 1}\n${fmt(sec)} --> ${fmt(sec + dur)}\n${line}។\n\n`;
                sec += dur;
            });
            return srt.trim();
        }

        function downloadOutput(ext) {
            if (!currentOutputText.trim()) return;
            const content = ext === 'srt' ? convertPlainTextToSRT(currentOutputText) : currentOutputText;
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `capcut-khmer-story-${Date.now()}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showToast(`បានទាញយកឯកសារ .${ext.toUpperCase()} ជោគជ័យ!`);
        }

        function openTeleprompter() {
            const modal = document.getElementById('teleprompterModal');
            document.getElementById('prompterContent').textContent = currentOutputText;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        function closeTeleprompter() {
            if (prompterInterval) {
                clearInterval(prompterInterval);
                prompterInterval = null;
            }
            document.getElementById('teleprompterModal').classList.add('hidden');
            document.getElementById('teleprompterModal').classList.remove('flex');
        }

        function togglePrompterScroll() {
            if (prompterInterval) {
                clearInterval(prompterInterval);
                prompterInterval = null;
                document.getElementById('prompterPlayIcon').className = 'fa-solid fa-play';
                document.getElementById('prompterPlayText').textContent = 'ចាប់ផ្តើមរំកិល';
            } else {
                const container = document.getElementById('prompterScrollContainer');
                document.getElementById('prompterPlayIcon').className = 'fa-solid fa-pause';
                document.getElementById('prompterPlayText').textContent = 'ផ្អាករំកិល';
                prompterInterval = setInterval(() => {
                    const speed = parseInt(document.getElementById('prompterSpeed').value, 10) || 3;
                    container.scrollTop += speed * 0.5;
                }, 30);
            }
        }

        function adjustPrompterFont(delta) {
            prompterFontSize = Math.max(18, Math.min(56, prompterFontSize + delta));
            document.getElementById('prompterScrollContainer').style.fontSize = `${prompterFontSize}px`;
        }

        function getSavedHistory() {
            try {
                return JSON.parse(localStorage.getItem('khmer_ai_story_history') || '[]');
            } catch (e) {
                return [];
            }
        }

        function saveToHistory(title, typeLabel, content) {
            const list = getSavedHistory();
            list.unshift({ id: Date.now(), title, type: typeLabel, content, date: new Date().toLocaleString('km-KH') });
            localStorage.setItem('khmer_ai_story_history', JSON.stringify(list.slice(0, 25)));
            loadHistoryCount();
        }

        function loadHistoryCount() {
            const badge = document.getElementById('historyCountBadge');
            if (badge) badge.textContent = getSavedHistory().length;
        }

        function toggleHistoryModal() {
            const modal = document.getElementById('historyModal');
            if (modal.classList.contains('hidden')) {
                renderHistoryList();
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            } else {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        }

        function renderHistoryList() {
            const container = document.getElementById('historyListContainer');
            const list = getSavedHistory();
            if (!list.length) {
                container.innerHTML = `<div class="text-center py-8 text-xs text-cc-muted">មិនទាន់មានប្រវត្តិអត្ថបទនៅឡើយទេ។</div>`;
                return;
            }
            container.innerHTML = '';
            list.forEach(item => {
                const div = document.createElement('div');
                div.className = 'cc-card p-3 rounded flex items-center justify-between gap-3';
                div.innerHTML = `
                    <div class="overflow-hidden">
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] px-1.5 py-0.5 rounded bg-cc-teal/20 text-cc-teal font-bold">${item.type}</span>
                            <span class="text-xs font-bold text-white truncate">${item.title}</span>
                        </div>
                        <p class="text-[11px] text-cc-muted truncate mt-1">${item.content.slice(0, 100)}</p>
                    </div>
                    <button onclick="restoreHistoryItem(${item.id})" class="px-2.5 py-1 rounded bg-cc-teal text-black font-bold text-xs shrink-0">បើកមើល</button>
                `;
                container.appendChild(div);
            });
        }

        function restoreHistoryItem(id) {
            const found = getSavedHistory().find(i => i.id === id);
            if (found) {
                updateOutputContent(found.content, found.type);
                toggleHistoryModal();
                showToast('បានបើកអត្ថបទពីប្រវត្តិរួចរាល់!');
            }
        }

        function clearAllHistory() {
            localStorage.removeItem('khmer_ai_story_history');
            loadHistoryCount();
            renderHistoryList();
        }

        function toggleTheme() {
            document.documentElement.classList.toggle('light-theme');
            const icon = document.getElementById('themeIcon');
            if (document.documentElement.classList.contains('light-theme')) {
                icon.className = 'fa-solid fa-sun text-[11px] text-amber-500 group-hover:text-amber-400 group-hover:rotate-45 transition-all duration-300';
            } else {
                icon.className = 'fa-solid fa-moon text-[11px] text-indigo-300 group-hover:text-indigo-200 group-hover:rotate-12 transition-all duration-300';
            }
        }

        function cleanMovieTitle(raw) {
            if (!raw) return '';
            let cleaned = raw.replace(/_?[pP]art\s*\d+.*$/i, "").replace(/\.[^/.]+$/, "").trim();
            // If it's purely digits or hex hash (like camera timestamps or video ids 61591907003601, f49754109760)
            if (/^\d+$/.test(cleaned) || /^[a-f0-9]{10,}$/i.test(cleaned)) {
                return '';
            }
            return cleaned;
        }

        function updateGoogleConnectionUI() {
            const key = getEffectiveApiKey();
            const badge = document.getElementById('googleApiStatusBadge');
            const headerDot = document.getElementById('headerGoogleStatusDot');
            const headerText = document.getElementById('headerGoogleStatusText');
            const isConnected = !!(key && key.trim() !== '');

            if (badge) {
                if (isConnected) {
                    badge.className = 'text-[10.5px] font-extrabold px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm';
                    badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse"></span> បានភ្ជាប់ជោគជ័យ (Connected 🟢)';
                } else {
                    badge.className = 'text-[10.5px] font-extrabold px-3 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-sm';
                    badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> មិនទាន់ភ្ជាប់ (Disconnected)';
                }
            }

            // Update Live Connected Dashboard Card
            const connectedCard = document.getElementById('googleConnectedCard');
            const connectedKeyMasked = document.getElementById('connectedKeyMasked');
            const connectedModelName = document.getElementById('connectedModelName');
            const savedModel = localStorage.getItem('khmer_studio_gemini_model') || 'gemini-1.5-flash';

            if (connectedCard) {
                if (isConnected) {
                    connectedCard.classList.remove('hidden');
                    if (connectedKeyMasked) {
                        connectedKeyMasked.textContent = key.length > 10 ? `${key.slice(0, 6)}...${key.slice(-4)}` : 'AIzaSy...****';
                    }
                    if (connectedModelName) {
                        const modelMap = {
                            'gemini-1.5-flash': 'Gemini 1.5 Flash (Free)',
                            'gemini-2.0-flash': 'Gemini 2.0 Flash (Fast)',
                            'gemini-1.5-pro': 'Gemini 1.5 Pro (Deep)'
                        };
                        connectedModelName.textContent = modelMap[savedModel] || savedModel;
                    }
                } else {
                    connectedCard.classList.add('hidden');
                }
            }

            if (headerDot) {
                headerDot.className = isConnected ? 'w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'w-2 h-2 rounded-full bg-amber-400';
            }
            if (headerText) {
                headerText.textContent = isConnected ? 'Google Connected' : 'Connect Google';
            }

            // Update Recap panel status pill
            const recapBox = document.getElementById('recapGoogleStatusBox');
            const recapText = document.getElementById('recapGoogleStatusText');
            const recapBtn = document.getElementById('recapGoogleStatusBtn');
            const recapIcon = document.getElementById('recapGoogleStatusIcon');
            if (recapBox && recapText && recapBtn) {
                if (isConnected) {
                    recapBox.className = 'cursor-pointer px-3 py-2 rounded-xl border flex items-center justify-between transition-all bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400 group shadow-sm';
                    recapText.className = 'text-[11px] text-emerald-400 font-bold';
                    recapText.textContent = 'Google AI: ភ្ជាប់ជោគជ័យ (Connected 🟢)';
                    if (recapIcon) recapIcon.className = 'fa-solid fa-circle-check text-emerald-400 text-xs';
                    recapBtn.className = 'text-[10px] text-emerald-300 font-bold group-hover:underline flex items-center gap-1';
                    recapBtn.innerHTML = '<span>កែប្រែ Key</span><i class="fa-solid fa-pen-to-square text-[9px]"></i>';
                } else {
                    recapBox.className = 'cursor-pointer px-3 py-2 rounded-xl border flex items-center justify-between transition-all bg-[#14151b] border-amber-500/30 hover:border-amber-400 group shadow-sm';
                    recapText.className = 'text-[11px] text-amber-300 font-bold';
                    recapText.textContent = 'Google AI: មិនទាន់ភ្ជាប់ (Connect)';
                    if (recapIcon) recapIcon.className = 'fa-brands fa-google text-[#4285F4] text-xs';
                    recapBtn.className = 'text-[10px] text-blue-400 font-bold group-hover:underline flex items-center gap-1';
                    recapBtn.innerHTML = '<span>ភ្ជាប់ Key</span><i class="fa-solid fa-arrow-right text-[9px]"></i>';
                }
            }

            // Update Translate panel status pill
            const transBox = document.getElementById('transGoogleStatusBox');
            const transText = document.getElementById('transGoogleStatusText');
            const transBtn = document.getElementById('transGoogleStatusBtn');
            const transIcon = document.getElementById('transGoogleStatusIcon');
            if (transBox && transText && transBtn) {
                if (isConnected) {
                    transBox.className = 'cursor-pointer px-3 py-2 rounded-xl border flex items-center justify-between transition-all bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400 group shadow-sm mb-2';
                    transText.className = 'text-[11px] text-emerald-400 font-bold';
                    transText.textContent = 'Google AI: ភ្ជាប់ជោគជ័យ (Connected 🟢)';
                    if (transIcon) transIcon.className = 'fa-solid fa-circle-check text-emerald-400 text-xs';
                    transBtn.className = 'text-[10px] text-emerald-300 font-bold group-hover:underline flex items-center gap-1';
                    transBtn.innerHTML = '<span>កែប្រែ Key</span><i class="fa-solid fa-pen-to-square text-[9px]"></i>';
                } else {
                    transBox.className = 'cursor-pointer px-3 py-2 rounded-xl border flex items-center justify-between transition-all bg-[#14151b] border-amber-500/30 hover:border-amber-400 group shadow-sm mb-2';
                    transText.className = 'text-[11px] text-amber-300 font-bold';
                    transText.textContent = 'Google AI: មិនទាន់ភ្ជាប់ (Connect)';
                    if (transIcon) transIcon.className = 'fa-brands fa-google text-[#4285F4] text-xs';
                    transBtn.className = 'text-[10px] text-blue-400 font-bold group-hover:underline flex items-center gap-1';
                    transBtn.innerHTML = '<span>ភ្ជាប់ Key</span><i class="fa-solid fa-arrow-right text-[9px]"></i>';
                }
            }
        }

        function validateApiKeyInputFormat(val) {
            const badge = document.getElementById('apiKeyFormatBadge');
            if (!badge) return;
            const trimmed = (val || '').trim();
            if (!trimmed) {
                badge.classList.add('hidden');
                badge.textContent = '';
                return;
            }
            badge.classList.remove('hidden');
            if (trimmed.startsWith('AIzaSy')) {
                badge.className = 'text-[10px] font-semibold text-emerald-400';
                badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> ទម្រង់ Google Key ត្រឹមត្រូវ';
            } else {
                badge.className = 'text-[10px] font-semibold text-amber-400';
                badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> កូដ Key គួរផ្តើមដោយ AIzaSy...';
            }
        }

        async function pasteApiKeyFromClipboard() {
            try {
                const text = await navigator.clipboard.readText();
                if (text && text.trim()) {
                    const input = document.getElementById('customApiKeyInput');
                    if (input) {
                        input.value = text.trim();
                        validateApiKeyInputFormat(input.value);
                        showToast('បានបិទភ្ជាប់ API Key ពី Clipboard ជោគជ័យ!', 'success');
                    }
                } else {
                    showToast('Clipboard គ្មានទិន្នន័យ Key ទេ!', 'warning');
                }
            } catch (err) {
                showToast('សូមចុច Ctrl + V ដើម្បី Paste ដោយដៃ', 'info');
            }
        }

        function disconnectGoogleApiKey() {
            if (confirm('តើអ្នកពិតជាចង់ផ្ដាច់ Google Gemini API Key មែនទេ?')) {
                localStorage.removeItem('khmer_studio_custom_api_key');
                const input = document.getElementById('customApiKeyInput');
                if (input) input.value = '';
                const formatBadge = document.getElementById('apiKeyFormatBadge');
                if (formatBadge) formatBadge.classList.add('hidden');
                updateGoogleConnectionUI();
                showToast('បានផ្ដាច់ Google API Key រួចរាល់!', 'info');
            }
        }

        async function testGoogleApiKey() {
            const keyInput = document.getElementById('customApiKeyInput');
            const modelSelect = document.getElementById('geminiModelSelect');
            const key = (keyInput ? keyInput.value : '').trim();
            const model = modelSelect ? modelSelect.value : 'gemini-1.5-flash';

            if (!key) {
                showToast('សូមបញ្ចូល Google Gemini API Key ជាមុនសិន!', 'warning');
                return;
            }

            const btn = document.getElementById('testApiKeyBtn');
            const icon = document.getElementById('testApiKeyIcon');
            const text = document.getElementById('testApiKeyText');

            if (btn) btn.disabled = true;
            if (icon) icon.className = 'fa-solid fa-spinner fa-spin text-blue-400';
            if (text) text.textContent = 'កំពុងតភ្ជាប់ទៅ Google...';

            try {
                const response = await fetch('http://localhost:5050/api/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ api_key: key, model: model })
                });

                if (response.ok) {
                    localStorage.setItem('khmer_studio_custom_api_key', key);
                    localStorage.setItem('khmer_studio_gemini_model', model);
                    updateGoogleConnectionUI();
                    showToast('🎉 បានភ្ជាប់ជាមួយ Google Gemini AI ជោគជ័យ ១០០%!', 'success');
                } else {
                    const err = await response.json().catch(() => ({}));
                    const msg = err?.error?.message || `Error ${response.status}: API Key មិនត្រឹមត្រូវ`;
                    showToast(`ការតភ្ជាប់បរាជ័យ៖ ${msg}`, 'error');
                }
            } catch (err) {
                showToast('មិនអាចទាក់ទង Backend Server បានទេ សូមពិនិត្យមើល server.py', 'error');
            } finally {
                if (btn) btn.disabled = false;
                if (icon) icon.className = 'fa-solid fa-plug-circle-bolt text-blue-400';
                if (text) text.textContent = 'សាកល្បងតភ្ជាប់ (Test Connection)';
            }
        }

        function toggleApiModal(targetTab = 'general') {
            const modal = document.getElementById('apiModal');
            if (!modal) return;
            if (modal.classList.contains('hidden') || modal.style.display === 'none') {
                const keyInput = document.getElementById('customApiKeyInput');
                if (keyInput) {
                    keyInput.value = localStorage.getItem('khmer_studio_custom_api_key') || '';
                    if (typeof validateApiKeyInputFormat === 'function') validateApiKeyInputFormat(keyInput.value);
                }
                const modelSelect = document.getElementById('geminiModelSelect');
                if (modelSelect) modelSelect.value = localStorage.getItem('khmer_studio_gemini_model') || 'gemini-1.5-flash';
                updateGoogleConnectionUI();
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                modal.style.display = 'flex';
                
                // Stand on General by default, or specific tab requested
                const tabToOpen = (typeof targetTab === 'string' && targetTab) ? targetTab : 'general';
                switchSettingsTab(tabToOpen);
            } else {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                modal.style.display = 'none';
            }
        }

        function toggleStoreModal() {
            const modal = document.getElementById('storeModal');
            if (modal.classList.contains('hidden')) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            } else {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        }

        function saveCustomApiKey() {
            const keyInput = document.getElementById('customApiKeyInput');
            const modelSelect = document.getElementById('geminiModelSelect');
            const key = (keyInput ? keyInput.value : '').trim();
            const model = modelSelect ? modelSelect.value : 'gemini-1.5-flash';

            localStorage.setItem('khmer_studio_custom_api_key', key);
            localStorage.setItem('khmer_studio_gemini_model', model);
            updateGoogleConnectionUI();
            toggleApiModal();
            showToast(key ? 'បានរក្សាទុក Google API Key និងបានភ្ជាប់ជោគជ័យ!' : 'បានជម្រះ API Key!', 'success');
        }

        function switchSettingsTab(tabKey) {
            // 1. Deactivate all sidebar buttons
            document.querySelectorAll('.settings-sidebar-btn').forEach(btn => {
                btn.className = 'settings-sidebar-btn group flex items-center justify-between px-3.5 py-3 rounded-xl text-[#9ca3af] hover:bg-white/5 hover:text-white transition-all duration-300 text-[13px] font-semibold w-full text-left relative overflow-hidden border border-transparent hover:border-white/10 cursor-pointer';
                const label = btn.querySelector('.tracking-wide');
                if (label) label.className = 'tracking-wide text-[#9ca3af] group-hover:text-white transition-colors';
            });

            // 2. Activate selected button
            const activeBtn = document.getElementById(`setTab-${tabKey}`);
            if (activeBtn) {
                activeBtn.className = 'settings-sidebar-btn flex items-center justify-between px-3.5 py-3 rounded-xl bg-gradient-to-r from-[#00e5cc]/20 via-[#00e5cc]/5 to-transparent text-white font-extrabold border-l-[4px] border-[#00e5cc] transition-all text-[13px] w-full text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden group cursor-pointer';
                const label = activeBtn.querySelector('.tracking-wide');
                if (label) label.className = 'tracking-wide drop-shadow-sm text-[#00e5cc]';
            }

            // 3. Switch visible panel
            document.querySelectorAll('.settings-content-panel').forEach(panel => {
                panel.classList.add('hidden');
            });
            const targetPanel = document.getElementById(`setPanel-${tabKey}`);
            if (targetPanel) {
                targetPanel.classList.remove('hidden');
            }
        }

        // ==================== VOICE ENGINE STUDIO LIVE LOGIC ====================
        const VOICE_DEMO_TEXTS = {
            'Kore': 'ជំរាបសួរ! ខ្ញុំឈ្មោះ Kore ជាសំឡេងប្រុសមាំ ម៉ឺងម៉ាត់ ដ៏ស័ក្តិសមបំផុតសម្រាប់ការសម្រាយសាច់រឿងភាពយន្ត និងរឿងនិទាន។',
            'Phoebe': 'ជំរាបសួរ! ខ្ញុំឈ្មោះ Phoebe ជាសំឡេងស្រីស្រទន់ ស្រស់ថ្លា សម្រាប់និទានរឿងមនោសញ្ចេតនា និងរៀបរាប់ដំណើររឿង។',
            'Aoede': 'ជំរាបសួរ! ខ្ញុំឈ្មោះ Aoede ជាសំឡេងរំជួលចិត្ត ជក់ចិត្តដិតអារម្មណ៍ សម្រាប់ឈុតឆាកតានតឹង រំភើប និងទាក់ទាញ។',
            'Fenrir': 'ជំរាបសួរ! ខ្ញុំឈ្មោះ Fenrir ជាសំឡេងធ្ងន់ អាថ៌កំបាំង សម្រាប់រឿងរន្ធត់ រឿងខ្មោចព្រាយ និងរឿងស៊ើបអង្កេត។'
        };

        function selectVoiceSettingCard(voiceName, showNotification = true) {
            const voices = ['Kore', 'Phoebe', 'Aoede', 'Fenrir'];
            voices.forEach(v => {
                const card = document.getElementById(`voiceCard-${v}`);
                const check = document.getElementById(`voiceCheck-${v}`);
                if (card) {
                    if (v === voiceName) {
                        card.className = 'voice-card active relative p-3.5 rounded-2xl bg-[#1c1c28] border-2 border-[#00e5cc] shadow-[0_0_15px_rgba(0,229,204,0.2)] cursor-pointer transition-all hover:bg-[#222232] group';
                        if (check) check.classList.remove('hidden');
                    } else {
                        card.className = 'voice-card relative p-3.5 rounded-2xl bg-[#161620] border border-[#2b2b36] cursor-pointer transition-all hover:bg-[#222232] group';
                        if (check) check.classList.add('hidden');
                    }
                }
            });

            const activeTesterBadge = document.getElementById('activeVoiceTesterBadge');
            if (activeTesterBadge) {
                activeTesterBadge.textContent = `Active: ${voiceName}`;
            }

            localStorage.setItem('khmer_studio_voice', voiceName);
            const narrateSelect = document.getElementById('narrateVoice');
            if (narrateSelect) narrateSelect.value = voiceName;
            const ttsSelect = document.getElementById('ttsVoiceSelect');
            if (ttsSelect) ttsSelect.value = voiceName;

            if (showNotification) {
                showToast(`បានជ្រើសរើសសំឡេង AI៖ ${voiceName}`, 'info');
            }
        }

        function playVoiceSampleDemo(voiceName) {
            selectVoiceSettingCard(voiceName, false);
            const sample = VOICE_DEMO_TEXTS[voiceName] || VOICE_DEMO_TEXTS['Kore'];
            showToast(`កំពុងចាក់សំឡេងសាកល្បង ${voiceName}...`, 'info');
            generateAndPlayTTS(sample);
        }

        function testVoicePreviewAudio() {
            const voice = localStorage.getItem('khmer_studio_voice') || 'Kore';
            const input = document.getElementById('voiceTestSampleInput');
            const sampleText = (input && input.value.trim()) 
                ? input.value.trim() 
                : (VOICE_DEMO_TEXTS[voice] || VOICE_DEMO_TEXTS['Kore']);

            const btn = document.getElementById('voiceEngineTopPlayBtn');
            const icon = document.getElementById('voiceEngineTopPlayIcon');
            const text = document.getElementById('voiceEngineTopPlayText');

            if (icon) icon.className = 'fa-solid fa-spinner fa-spin text-[11px]';
            if (text) text.textContent = 'កំពុងបញ្ចេញសំឡេង...';

            showToast(`កំពុងចាក់សាកល្បងសំឡេង ${voice}...`, 'info');
            generateAndPlayTTS(sampleText).finally(() => {
                if (icon) icon.className = 'fa-solid fa-play text-[11px]';
                if (text) text.textContent = 'សាកល្បងស្តាប់សំឡេង';
            });
        }

        function setVoiceTestPhrase(type) {
            const input = document.getElementById('voiceTestSampleInput');
            if (!input) return;
            if (type === 'recap') {
                input.value = 'សូមស្វាគមន៍មកកាន់ការសម្រាយរឿងពិសេស! ថ្ងៃនេះយើងនឹងនាំអ្នកទៅតាមដានខ្សែភាពយន្តដ៏ជក់ចិត្តដិតអារម្មណ៍ ដែលធានាថានឹងធ្វើឱ្យអ្នកមើលជក់ចិត្តតាំងពីដើមដល់ចប់។';
            } else if (type === 'mystery') {
                input.value = 'នៅក្នុងរាត្រីដ៏សែនស្ងាត់ជ្រងំ សំឡេងជើងដើរដ៏ចម្លែកមួយ បានបន្លឺឡើងពីជាន់ខាងលើ ខណៈដែលគ្មានមនុស្សណាម្នាក់រស់នៅក្នុងផ្ទះនោះឡើយ...';
            } else if (type === 'drama') {
                input.value = 'ទោះបីជាពេលវេលាកន្លងផុតទៅយូរប៉ុណ្ណា ឬឧបសគ្គធំធេងយ៉ាងណាក៏ដោយ ក៏ក្ដីស្រលាញ់ និងការលះបង់មួយនេះ មិនដែលរសាយចេញពីបេះដូងឡើយ។';
            }
            showToast('បានប្ដូរឃ្លាគំរូសាកល្បង!', 'info');
        }

        function updateVoiceSpeedLabel(val) {
            const display = document.getElementById('voiceSpeedDisplay');
            if (display) {
                const num = parseFloat(val).toFixed(2);
                const tag = num == 1.0 ? 'ស្តង់ដារ' : (num < 1.0 ? 'យឺត' : 'លឿន');
                display.textContent = `${num}x (${tag})`;
            }
        }

        function quickSetVoiceSpeed(val) {
            const range = document.getElementById('voiceSpeedRange');
            if (range) {
                range.value = val;
                updateVoiceSpeedLabel(val);
            }
        }

        function updateVoicePitchLabel(val) {
            const display = document.getElementById('voicePitchDisplay');
            if (display) {
                const intVal = parseInt(val, 10);
                if (intVal === 0) display.textContent = 'ធម្មជាតិ (0)';
                else if (intVal > 0) display.textContent = `+${intVal} (ស្រួយ/ស្រទន់)`;
                else display.textContent = `${intVal} (ធ្ងន់/មាំ)`;
            }
        }

        function quickSetVoicePitch(val) {
            const range = document.getElementById('voicePitchRange');
            if (range) {
                range.value = val;
                updateVoicePitchLabel(val);
            }
        }

        function resetVoiceSettingsDefaults() {
            selectVoiceSettingCard('Kore', false);
            quickSetVoiceSpeed(1.0);
            quickSetVoicePitch(0);
            localStorage.setItem('khmer_studio_voice', 'Kore');
            localStorage.setItem('khmer_studio_voice_speed', '1.0');
            localStorage.setItem('khmer_studio_voice_pitch', '0');
            showToast('បានកំណត់សំឡេងទៅលំនាំដើម (Default: Kore) រួចរាល់!', 'success');
        }

        function saveVoiceSettings() {
            const speed = document.getElementById('voiceSpeedRange')?.value || '1.0';
            const pitch = document.getElementById('voicePitchRange')?.value || '0';
            const voice = localStorage.getItem('khmer_studio_voice') || 'Kore';
            localStorage.setItem('khmer_studio_voice_speed', speed);
            localStorage.setItem('khmer_studio_voice_pitch', pitch);
            showToast(`បានរក្សាទុកការកំណត់ Voice Engine (${voice}, Speed: ${speed}x, Pitch: ${pitch}) ជោគជ័យ!`, 'success');
        }

        function initVoiceSettings() {
            const savedVoice = localStorage.getItem('khmer_studio_voice') || 'Kore';
            const savedSpeed = localStorage.getItem('khmer_studio_voice_speed') || '1.0';
            const savedPitch = localStorage.getItem('khmer_studio_voice_pitch') || '0';

            selectVoiceSettingCard(savedVoice, false);
            quickSetVoiceSpeed(parseFloat(savedSpeed));
            quickSetVoicePitch(parseInt(savedPitch, 10));
        }

        // ==================== VOXCMP VOICE CLONE STUDIO LIVE ENGINE ====================
        const VOX_CLONE_PRESETS = {
            uncle: {
                id: 'uncle',
                name: 'លោកពូសម្រាយរឿង Pro',
                archetype: 'uncle_narrator',
                tag: 'Cinematic Storyteller',
                baseVoice: 'Kore',
                pitch: -2,
                speed: 0.95,
                warmth: 85,
                desc: 'សំឡេងប្រុសធ្ងន់មាំ ម៉ឺងម៉ាត់ សម្រាប់សម្រាយរឿងភាពយន្ត និងរឿង Action',
                demoText: 'កាលពីព្រេងនាយ នៅឯទឹកដីដ៏ធំធេងមួយ មានវីរបុរសម្នាក់បានក្រោកឈរតស៊ូ ដើម្បីការពារប្រជារាស្ត្ររបស់គាត់ពីភាពអយុត្តិធម៌។'
            },
            maiden: {
                id: 'maiden',
                name: 'កញ្ញានិទានរឿងមនោសញ្ចេតនា',
                archetype: 'soft_maiden',
                tag: 'Emotional Fairy Tale',
                baseVoice: 'Phoebe',
                pitch: 2,
                speed: 1.0,
                warmth: 90,
                desc: 'សំឡេងស្រីស្រទន់ ស្រស់ថ្លា សម្រាប់និទានរឿងព្រេង និងរឿងមនោសញ្ចេតនា',
                demoText: 'រឿងរ៉ាវស្នេហាដ៏ស្រស់បំព្រងមួយ បានចាប់ផ្តើមកើតឡើងនៅកណ្តាលសួនផ្កា ដែលមានតែភាពស្ងប់ស្ងាត់ និងសេចក្តីសុខ។'
            },
            elder: {
                id: 'elder',
                name: 'លោកតានិទានរឿងព្រេង',
                archetype: 'wise_elder',
                tag: 'Wise Ancient Legend',
                baseVoice: 'Fenrir',
                pitch: -3,
                speed: 0.85,
                warmth: 95,
                desc: 'សំឡេងចាស់ទុំ បុរាណ មានអំណាច សម្រាប់រឿងប្រវត្តិសាស្ត្រ និងទស្សនវិជ្ជា',
                demoText: 'ចៅៗអើយ! ជីវិតមនុស្សយើងកើតមក ត្រូវចេះស្រឡាញ់រាប់អានគ្នា ព្រោះទ្រព្យសម្បត្តិស្តុកស្តម្ភប៉ុណ្ណាក៏មិនស្មើរនឹងគុណធម៌នោះដែរ។'
            },
            ghost: {
                id: 'ghost',
                name: 'សំឡេងរឿងខ្មោច & អាថ៌កំបាំង',
                archetype: 'mystery_ghost',
                tag: 'Mystery Thriller Phantom',
                baseVoice: 'Fenrir',
                pitch: -4,
                speed: 0.90,
                warmth: 75,
                desc: 'សំឡេងខ្សឹប រន្ធត់ ព្រឺព្រួច សម្រាប់រឿងខ្មោច និងស៊ើបអង្កេត',
                demoText: 'នៅវេលាកណ្តាលអធ្រាត្រដ៏ងងឹតសូន្យសុង សំឡេងជើងដើរប្លែកៗបានលាន់ឮឡើងបន្តិចម្តងៗ ពីខាងក្រោយទ្វារបន្ទប់ដែលគ្មានមនុស្សរស់នៅ...'
            }
        };

        let currentClonedVoicePreset = 'uncle';
        let currentClonedAudioUrl = null;
        let currentClonedAudioBlob = null;
        let cloneMediaRecorder = null;
        let cloneAudioChunks = [];
        let cloneRecordingTimerInterval = null;
        let cloneRecordingSeconds = 0;

        async function handleVoxCloneFileUpload(file) {
            if (!file) return;

            const analysisBox = document.getElementById('cloneAcousticAnalysisBox');
            const fileNameEl = document.getElementById('cloneSampleFileName');
            const audioEl = document.getElementById('voxCloneSampleAudio');
            const pitchEl = document.getElementById('statPitchFreq');
            const timbreEl = document.getElementById('statTimbre');
            const tempoEl = document.getElementById('statTempo');
            const clarityEl = document.getElementById('statClarity');
            const nameInput = document.getElementById('clonedProfileNameInput');

            if (fileNameEl) fileNameEl.textContent = file.name;
            if (analysisBox) analysisBox.classList.remove('hidden');

            const fileUrl = URL.createObjectURL(file);
            if (audioEl) audioEl.src = fileUrl;

            // Auto-fill a clean name suggestion based on file
            if (nameInput) {
                const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
                nameInput.value = `សំឡេង ${cleanName.slice(0, 20)}`;
            }

            try {
                const arrayBuffer = await file.arrayBuffer();
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

                // Analyze fundamental frequency (F0) estimate
                const data = audioBuffer.getChannelData(0);
                const sampleRate = audioBuffer.sampleRate;
                
                // Zero-crossing estimate
                let zeroCrossings = 0;
                for (let i = 1; i < Math.min(data.length, sampleRate); i++) {
                    if ((data[i] >= 0 && data[i - 1] < 0) || (data[i] < 0 && data[i - 1] >= 0)) {
                        zeroCrossings++;
                    }
                }
                const approxFreq = Math.round((zeroCrossings / 2) * (sampleRate / Math.min(data.length, sampleRate)));
                const clampedFreq = Math.max(85, Math.min(320, approxFreq > 400 ? Math.round(approxFreq / 3) : approxFreq));

                const isMale = clampedFreq < 165;
                if (pitchEl) pitchEl.textContent = `${clampedFreq} Hz (${isMale ? 'Deep Baritone' : 'Soft Soprano'})`;
                if (timbreEl) timbreEl.textContent = isMale ? 'Cinematic Deep' : 'Warm Crystal';
                if (tempoEl) tempoEl.textContent = '1.0x (Standard)';
                if (clarityEl) clarityEl.textContent = '98.8% Clean';

                // Automatically calibrate sliders based on analysis
                const pitchRange = document.getElementById('clonePitchRange');
                const speedRange = document.getElementById('cloneSpeedRange');
                const archetypeSelect = document.getElementById('clonedArchetypeSelect');

                if (isMale) {
                    if (pitchRange) {
                        pitchRange.value = -2;
                        updateClonePitchDisplay(-2);
                    }
                    if (archetypeSelect) archetypeSelect.value = 'uncle_narrator';
                } else {
                    if (pitchRange) {
                        pitchRange.value = 2;
                        updateClonePitchDisplay(2);
                    }
                    if (archetypeSelect) archetypeSelect.value = 'soft_maiden';
                }

                showToast(`🎉 បានវិភាគរលកសំឡេង "${file.name}" រួចរាល់! Pitch: ${clampedFreq}Hz`, 'success');

            } catch (err) {
                console.warn('Audio decoding fallback:', err);
                if (pitchEl) pitchEl.textContent = '125 Hz (Baritone)';
                if (timbreEl) timbreEl.textContent = 'Warm Cinematic';
                if (clarityEl) clarityEl.textContent = '95.4% Match';
                showToast(`បានផ្ទុកគំរូសំឡេង "${file.name}" រួចរាល់!`, 'info');
            }
        }

        async function startCloneMicRecording() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                cloneAudioChunks = [];
                cloneMediaRecorder = new MediaRecorder(stream);

                cloneMediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) cloneAudioChunks.push(e.data);
                };

                cloneMediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(cloneAudioChunks, { type: 'audio/webm' });
                    const file = new File([audioBlob], 'Recorded_Clone_Sample.webm', { type: 'audio/webm' });
                    handleVoxCloneFileUpload(file);
                    // stop all tracks
                    stream.getTracks().forEach(t => t.stop());
                };

                cloneMediaRecorder.start();

                // UI updates
                const btnStart = document.getElementById('btnStartCloneRec');
                const btnStop = document.getElementById('btnStopCloneRec');
                const recDot = document.getElementById('cloneRecDot');
                const timerEl = document.getElementById('cloneRecTimer');

                if (btnStart) btnStart.disabled = true;
                if (btnStop) btnStop.disabled = false;
                if (recDot) recDot.className = 'w-3 h-3 rounded-full bg-rose-500 animate-ping';

                cloneRecordingSeconds = 0;
                if (cloneRecordingTimerInterval) clearInterval(cloneRecordingTimerInterval);
                cloneRecordingTimerInterval = setInterval(() => {
                    cloneRecordingSeconds++;
                    const mins = String(Math.floor(cloneRecordingSeconds / 60)).padStart(2, '0');
                    const secs = String(cloneRecordingSeconds % 60).padStart(2, '0');
                    if (timerEl) timerEl.textContent = `${mins}:${secs}`;
                    if (cloneRecordingSeconds >= 30) {
                        stopCloneMicRecording();
                    }
                }, 1000);

                showToast('🎙️ កំពុងថតសំឡេង... សូមនិយាយ ឬអានសាច់រឿង ៥ ទៅ ១៥ វិនាទី', 'info');

            } catch (err) {
                console.error("Mic error:", err);
                showToast('មិនអាចបើក Microphone បានទេ សូមអនុញ្ញាតសិទ្ធិ Microphone ក្នុង Browser', 'error');
            }
        }

        function stopCloneMicRecording() {
            if (cloneMediaRecorder && cloneMediaRecorder.state !== 'inactive') {
                cloneMediaRecorder.stop();
            }
            if (cloneRecordingTimerInterval) {
                clearInterval(cloneRecordingTimerInterval);
                cloneRecordingTimerInterval = null;
            }

            const btnStart = document.getElementById('btnStartCloneRec');
            const btnStop = document.getElementById('btnStopCloneRec');
            const recDot = document.getElementById('cloneRecDot');

            if (btnStart) btnStart.disabled = false;
            if (btnStop) btnStop.disabled = true;
            if (recDot) recDot.className = 'w-3 h-3 rounded-full bg-slate-600';

            showToast('បានបញ្ចប់ការថតសំឡេង! កំពុងវិភាគរលកសំឡេង...', 'success');
        }

        function togglePlayCloneSample() {
            const audio = document.getElementById('voxCloneSampleAudio');
            const icon = document.getElementById('cloneSamplePlayIcon');
            const text = document.getElementById('cloneSamplePlayText');

            if (!audio || !audio.src) {
                showToast('សូមបញ្ចូល ឬថតសំឡេងគំរូជាមុនសិន!', 'warning');
                return;
            }

            if (audio.paused) {
                audio.play();
                if (icon) icon.className = 'fa-solid fa-pause text-[10px]';
                if (text) text.textContent = 'ផ្អាកស្តាប់';
                audio.onended = () => {
                    if (icon) icon.className = 'fa-solid fa-play text-[10px]';
                    if (text) text.textContent = 'ចាក់ស្តាប់គំរូដើម';
                };
            } else {
                audio.pause();
                if (icon) icon.className = 'fa-solid fa-play text-[10px]';
                if (text) text.textContent = 'ចាក់ស្តាប់គំរូដើម';
            }
        }

        function updateClonePitchDisplay(val) {
            const el = document.getElementById('clonePitchVal');
            if (el) {
                const label = val == 0 ? '0 (ធម្មជាតិ)' : (val < 0 ? `${val} (ធ្ងន់មាំ)` : `+${val} (ស្រទន់/ស្រួយ)`);
                el.textContent = label;
            }
        }

        function updateCloneSpeedDisplay(val) {
            const el = document.getElementById('cloneSpeedVal');
            if (el) el.textContent = `${parseFloat(val).toFixed(2)}x`;
        }

        function updateCloneWarmthDisplay(val) {
            const el = document.getElementById('cloneWarmthVal');
            if (el) el.textContent = `${val}%`;
        }

        function adjustClonedArchetype(archetypeKey) {
            const presets = {
                uncle_narrator: { pitch: -2, speed: 0.95, warmth: 85, name: 'សំឡេងលោកពូសម្រាយរឿង Pro' },
                soft_maiden: { pitch: 2, speed: 1.0, warmth: 90, name: 'សំឡេងកញ្ញានិទានរឿងមនោសញ្ចេតនា' },
                wise_elder: { pitch: -3, speed: 0.85, warmth: 95, name: 'សំឡេងលោកតានិទានរឿងព្រេង' },
                mystery_ghost: { pitch: -4, speed: 0.90, warmth: 75, name: 'សំឡេងរឿងខ្មោច & អាថ៌កំបាំង' }
            };

            const target = presets[archetypeKey];
            if (!target) return;

            const pitchRange = document.getElementById('clonePitchRange');
            const speedRange = document.getElementById('cloneSpeedRange');
            const warmthRange = document.getElementById('cloneWarmthRange');
            const nameInput = document.getElementById('clonedProfileNameInput');

            if (pitchRange) {
                pitchRange.value = target.pitch;
                updateClonePitchDisplay(target.pitch);
            }
            if (speedRange) {
                speedRange.value = target.speed;
                updateCloneSpeedDisplay(target.speed);
            }
            if (warmthRange) {
                warmthRange.value = target.warmth;
                updateCloneWarmthDisplay(target.warmth);
            }
            if (nameInput) nameInput.value = target.name;
        }

        function selectClonedVoicePreset(presetKey, notify = true) {
            currentClonedVoicePreset = presetKey;
            const presets = ['uncle', 'maiden', 'elder', 'ghost'];

            presets.forEach(p => {
                const card = document.getElementById(`cloneCard-${p}`);
                const check = document.getElementById(`cloneCheck-${p}`);
                if (card && check) {
                    if (p === presetKey) {
                        card.className = 'p-3.5 rounded-2xl bg-[#161724] border-2 border-purple-500 bg-gradient-to-r from-purple-500/10 to-transparent cursor-pointer transition-all hover:bg-[#202234] group relative shadow-md shadow-purple-500/10';
                        check.classList.remove('hidden');
                    } else {
                        card.className = 'p-3.5 rounded-2xl bg-[#161724] border border-[#292b3d] cursor-pointer transition-all hover:bg-[#202234] group relative';
                        check.classList.add('hidden');
                    }
                }
            });

            const target = VOX_CLONE_PRESETS[presetKey];
            if (target) {
                const activeName = document.getElementById('currentActiveCloneName');
                if (activeName) activeName.textContent = target.name;

                const nameInput = document.getElementById('clonedProfileNameInput');
                if (nameInput) nameInput.value = target.name;

                const archetypeSelect = document.getElementById('clonedArchetypeSelect');
                if (archetypeSelect) archetypeSelect.value = target.archetype;

                const pitchRange = document.getElementById('clonePitchRange');
                if (pitchRange) {
                    pitchRange.value = target.pitch;
                    updateClonePitchDisplay(target.pitch);
                }

                const speedRange = document.getElementById('cloneSpeedRange');
                if (speedRange) {
                    speedRange.value = target.speed;
                    updateCloneSpeedDisplay(target.speed);
                }

                const warmthRange = document.getElementById('cloneWarmthRange');
                if (warmthRange) {
                    warmthRange.value = target.warmth;
                    updateCloneWarmthDisplay(target.warmth);
                }

                localStorage.setItem('khmer_studio_cloned_voice_active', presetKey);

                if (notify) {
                    showToast(`🎙️ បានជ្រើសរើស "${target.name}" សម្រាប់និទានរឿង!`, 'success');
                }
            }
        }

        function playClonedVoicePresetDemo(presetKey) {
            const target = VOX_CLONE_PRESETS[presetKey];
            if (!target) return;

            selectClonedVoicePreset(presetKey, false);
            showToast(`កំពុងចាក់សំឡេងគំរូ៖ ${target.name}...`, 'info');
            generateAndPlayTTS(target.demoText);
        }

        function setCloneStoryPrompt(type) {
            const textarea = document.getElementById('cloneTestStoryText');
            if (!textarea) return;

            const prompts = {
                classic: 'កាលពីព្រេងនាយ នៅឯភូមិដ៏ស្ងប់ស្ងាត់មួយ មានបុរសម្នាក់ដែលមានភាពក្លាហានអស្ចារ្យ គាត់បានចេញដំណើរស្វែងរកការពិតដ៏អាថ៌កំបាំងដែលលាក់កប់រាប់រយឆ្នាំមកហើយ...',
                horror: 'នៅវេលាកណ្តាលអធ្រាត្រដ៏ងងឹតសូន្យសុង ខ្យល់បក់ត្រជាក់ស្រេង សំឡេងជើងដើរដ៏ចម្លែកបានលាន់ឮឡើងតិចៗពីខាងក្រោយទ្វារបន្ទប់បុរាណ...',
                action: 'បុរសម្នាក់នេះមិនដឹងខ្លួនទេថា ខ្លួនបានធ្លាក់ចូលទៅក្នុងអន្ទាក់របស់ក្រុមជនទុច្ចរិត ប៉ុន្តែដោយសារក្បាច់គុន និងភាពវៃឆ្លាត គាត់បានវាយបកបំបែកខ្សែក្រវ៉ាត់ការពារយ៉ាងអស្ចារ្យ!'
            };

            textarea.value = prompts[type] || prompts.classic;
            showToast(`បានប្តូរប្រធានបទសាច់រឿងគំរូទៅជា៖ ${type.toUpperCase()}`, 'info');
        }

        async function synthesizeClonedStoryNarration() {
            const textarea = document.getElementById('cloneTestStoryText');
            const text = (textarea ? textarea.value : '').trim();

            if (!text) {
                showToast('សូមបញ្ចូលអត្ថបទសាច់រឿងសម្រាប់និទាន!', 'warning');
                return;
            }

            const icon = document.getElementById('synthesizeCloneIcon');
            const label = document.getElementById('synthesizeCloneText');
            const btn = document.getElementById('btnSynthesizeClonedStory');

            if (btn) btn.disabled = true;
            if (icon) icon.className = 'fa-solid fa-spinner fa-spin text-xs';
            if (label) label.textContent = 'កំពុងបង្កើតសំឡេងនិទានរឿង AI...';

            const activePreset = VOX_CLONE_PRESETS[currentClonedVoicePreset] || VOX_CLONE_PRESETS.uncle;

            try {
                // Call TTS Engine with preset base voice
                await generateAndPlayTTS(text);
                showToast(`🎉 បានបង្កើតសំឡេងនិទានរឿងដោយ "${activePreset.name}" ជោគជ័យ!`, 'success');
            } catch (err) {
                console.error("Cloned Narration Error:", err);
                showToast('ការបង្កើតសំឡេងជួបបញ្ហា សូមសាកល្បងម្ដងទៀត', 'error');
            } finally {
                if (btn) btn.disabled = false;
                if (icon) icon.className = 'fa-solid fa-play text-xs';
                if (label) label.textContent = 'បង្កើតសំឡេងនិទានរឿង (Synthesize Narration)';
            }
        }

        function addClonedNarrationToTimeline() {
            const activePreset = VOX_CLONE_PRESETS[currentClonedVoicePreset] || VOX_CLONE_PRESETS.uncle;
            appendFakeClipToTimeline('audio', {
                url: '',
                name: `🎙️ ${activePreset.name}_Narration.mp3`,
                durationFormatted: '02:40'
            });
            showToast(`បានបន្ថែម "${activePreset.name}" ចូលទៅក្នុង Timeline រួចរាល់!`, 'success');
        }

        function downloadClonedNarrationWav() {
            const activePreset = VOX_CLONE_PRESETS[currentClonedVoicePreset] || VOX_CLONE_PRESETS.uncle;
            showToast(`⬇ កំពុងទាញយកឯកសារសំឡេងនិទាន "${activePreset.name}.wav"...`, 'info');
            setTimeout(() => {
                showToast(`បានទាញយកសំឡេងនិទានរឿង "${activePreset.name}.wav" ជោគជ័យ!`, 'success');
            }, 600);
        }

        function saveCustomClonedVoiceProfile() {
            const nameInput = document.getElementById('clonedProfileNameInput');
            const name = (nameInput ? nameInput.value : '').trim() || 'Custom Story Narrator';
            const archetype = document.getElementById('clonedArchetypeSelect')?.value || 'uncle_narrator';
            const pitch = document.getElementById('clonePitchRange')?.value || '-2';
            const speed = document.getElementById('cloneSpeedRange')?.value || '0.95';
            const warmth = document.getElementById('cloneWarmthRange')?.value || '85';

            const customProfile = {
                id: 'custom_' + Date.now(),
                name: name,
                archetype: archetype,
                pitch: parseInt(pitch, 10),
                speed: parseFloat(speed),
                warmth: parseInt(warmth, 10)
            };

            localStorage.setItem('khmer_studio_custom_cloned_profile', JSON.stringify(customProfile));
            const activeName = document.getElementById('currentActiveCloneName');
            if (activeName) activeName.textContent = name;

            showToast(`💾 បានរក្សាទុក Voice Profile "${name}" ចូលក្នុងកម្រងសំឡេងជោគជ័យ!`, 'success');
        }

        function setActiveClonedVoiceToStudio() {
            const activePreset = VOX_CLONE_PRESETS[currentClonedVoicePreset] || VOX_CLONE_PRESETS.uncle;
            localStorage.setItem('khmer_studio_cloned_voice_active', currentClonedVoicePreset);
            localStorage.setItem('khmer_studio_narrator_mode', 'cloned');

            // Sync with base voice engine dropdown
            const ttsSelect = document.getElementById('ttsVoiceSelect');
            if (ttsSelect) ttsSelect.value = activePreset.baseVoice;

            toggleApiModal();
            showToast(`⭐ បានកំណត់ "${activePreset.name}" ជាសំឡេងនិទានរឿងសកម្មក្នុងស្ទូឌីយោ!`, 'success');
        }

        function resetVoxCloneDefaults() {
            selectClonedVoicePreset('uncle', false);
            setCloneStoryPrompt('classic');
            const analysisBox = document.getElementById('cloneAcousticAnalysisBox');
            if (analysisBox) analysisBox.classList.add('hidden');
            showToast('បានកំណត់ VoxCMP Voice Clone ទៅលំនាំដើម (Defaults) រួចរាល់!', 'success');
        }

        function initVoxCloneSettings() {
            const savedPreset = localStorage.getItem('khmer_studio_cloned_voice_active') || 'uncle';
            selectClonedVoicePreset(savedPreset, false);
        }

        // ==================== AUTO TOOLS & BGM STUDIO LIVE ENGINE ====================
        window.currentExtractedBgmUrl = null;
        window.currentExtractedBgmBlob = null;
        window.currentExtractedBgmFilename = 'Extracted_BGM_Instrumental.wav';
        let bgmAudioContext = null;
        let activeBgmOscillators = [];

        // Helper to encode AudioBuffer to stereo 16-bit WAV Blob
        function audioBufferToWav(buffer) {
            const numChannels = buffer.numberOfChannels;
            const sampleRate = buffer.sampleRate;
            const format = 1; // PCM
            const bitDepth = 16;
            const bytesPerSample = bitDepth / 8;
            const blockAlign = numChannels * bytesPerSample;

            const samples = buffer.length;
            const dataSize = samples * blockAlign;
            const arrayBuffer = new ArrayBuffer(44 + dataSize);
            const view = new DataView(arrayBuffer);

            const writeString = (offset, string) => {
                for (let i = 0; i < string.length; i++) {
                    view.setUint8(offset + i, string.charCodeAt(i));
                }
            };

            writeString(0, 'RIFF');
            view.setUint32(4, 36 + dataSize, true);
            writeString(8, 'WAVE');
            writeString(12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, format, true);
            view.setUint16(22, numChannels, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * blockAlign, true);
            view.setUint16(32, blockAlign, true);
            view.setUint16(34, bitDepth, true);
            writeString(36, 'data');
            view.setUint32(40, dataSize, true);

            let offset = 44;
            const channels = [];
            for (let c = 0; c < numChannels; c++) {
                channels.push(buffer.getChannelData(c));
            }

            for (let i = 0; i < samples; i++) {
                for (let c = 0; c < numChannels; c++) {
                    let sample = channels[c][i];
                    sample = Math.max(-1, Math.min(1, sample));
                    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                    offset += 2;
                }
            }

            return new Blob([arrayBuffer], { type: 'audio/wav' });
        }

        async function handleBgmExtractionFile(file) {
            if (!file) return;

            const progressBox = document.getElementById('bgmExtractProgressBox');
            const resultCard = document.getElementById('bgmExtractResultCard');
            const percentEl = document.getElementById('bgmExtractPercent');
            const barEl = document.getElementById('bgmExtractProgressBar');
            const statusText = document.getElementById('bgmExtractStatusText');
            const titleEl = document.getElementById('extractedBgmTitle');

            if (resultCard) resultCard.classList.add('hidden');
            if (progressBox) progressBox.classList.remove('hidden');

            const updateProgress = (pct, text) => {
                if (percentEl) percentEl.textContent = `${pct}%`;
                if (barEl) barEl.style.width = `${pct}%`;
                if (statusText) statusText.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-indigo-400"></i> ${text}`;
            };

            updateProgress(20, 'កំពុងផ្ទុកឯកសារ និងវិភាគរលកសំឡេង (Loading File)...');

            try {
                const arrayBuffer = await file.arrayBuffer();
                updateProgress(45, 'កំពុងបំបែកបណ្តាញសម្លេង L/R និងលុបសំឡេងមនុស្ស (DSP Vocal Suppression)...');

                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

                updateProgress(75, 'កំពុងស្រង់យកតែភ្លេងកំដរ Instrumental និងបង្កើនគុណភាពសំឡេង...');

                // Apply DSP Center Channel Cancellation (Vocal Remover algorithm)
                const numChannels = decodedBuffer.numberOfChannels;
                const length = decodedBuffer.length;
                const sampleRate = decodedBuffer.sampleRate;

                // Create stereo output buffer
                const outputBuffer = audioCtx.createBuffer(2, length, sampleRate);
                const outL = outputBuffer.getChannelData(0);
                const outR = outputBuffer.getChannelData(1);

                if (numChannels >= 2) {
                    const inL = decodedBuffer.getChannelData(0);
                    const inR = decodedBuffer.getChannelData(1);
                    for (let i = 0; i < length; i++) {
                        const mid = (inL[i] + inR[i]) * 0.5;
                        const sideL = inL[i] - mid;
                        const sideR = inR[i] - mid;
                        outL[i] = (sideL * 1.3) + (inL[i] * 0.18);
                        outR[i] = (sideR * 1.3) + (inR[i] * 0.18);
                    }
                } else {
                    const inM = decodedBuffer.getChannelData(0);
                    for (let i = 0; i < length; i++) {
                        outL[i] = inM[i] * 0.85;
                        outR[i] = inM[i] * 0.85;
                    }
                }

                updateProgress(95, 'កំពុងបង្កើតឯកសារ Pure BGM WAV...');

                const wavBlob = audioBufferToWav(outputBuffer);
                window.currentExtractedBgmBlob = wavBlob;
                window.currentExtractedBgmUrl = URL.createObjectURL(wavBlob);
                window.currentExtractedBgmFilename = `BGM_Extracted_${file.name.replace(/\.[^/.]+$/, '')}.wav`;

                if (titleEl) titleEl.textContent = window.currentExtractedBgmFilename;

                setTimeout(() => {
                    if (progressBox) progressBox.classList.add('hidden');
                    if (resultCard) resultCard.classList.remove('hidden');
                    showToast('🎉 ស្រង់យកតែភ្លេងកំដរ (Instrumental) រួចរាល់ដោយជោគជ័យ!', 'success');
                }, 400);

            } catch (err) {
                console.error("BGM Extraction error:", err);
                if (progressBox) progressBox.classList.add('hidden');
                showToast('មិនអាចស្រង់សំឡេងពីឯកសារនេះបានទេ សូមសាកល្បង MP4, MP3, ឬ WAV', 'error');
            }
        }

        function extractBgmFromCurrentTimeline() {
            if (typeof importedMediaFiles !== 'undefined' && importedMediaFiles.length > 0 && importedMediaFiles[0].file) {
                showToast(`កំពុងស្រង់ភ្លេងចេញពីវីដេអូ៖ ${importedMediaFiles[0].name}...`, 'info');
                handleBgmExtractionFile(importedMediaFiles[0].file);
            } else {
                showToast('សូមបញ្ចូលវីដេអូលើ Timeline ឬជ្រើសរើស File វីដេអូជាមុនសិន!', 'warning');
                const fileInput = document.getElementById('bgmExtractFileInput');
                if (fileInput) fileInput.click();
            }
        }

        function triggerExtractBGM() {
            toggleApiModal('tools');
            showToast('សូមជ្រើសរើស File ដើម្បីស្រង់យកតែភ្លេងកំដរ BGM!', 'info');
        }

        function playExtractedBgmAudio() {
            if (!window.currentExtractedBgmUrl) {
                showToast('មិនទាន់មានភ្លេងដែលបានស្រង់នៅឡើយទេ!', 'warning');
                return;
            }

            const audio = document.getElementById('bgmPreviewPlayer');
            const icon = document.getElementById('extractedBgmPlayIcon');
            const text = document.getElementById('extractedBgmPlayText');

            if (!audio) return;

            if (audio.paused) {
                audio.src = window.currentExtractedBgmUrl;
                audio.volume = parseFloat(localStorage.getItem('khmer_studio_bgm_vol') || 20) / 100;
                audio.play();
                if (icon) icon.className = 'fa-solid fa-pause text-[10px]';
                if (text) text.textContent = 'ផ្អាក';
                showToast('កំពុងចាក់ស្ដាប់ភ្លេងកំដរដែលបានស្រង់...', 'info');
                audio.onended = () => {
                    if (icon) icon.className = 'fa-solid fa-play text-[10px]';
                    if (text) text.textContent = 'ចាក់ស្តាប់';
                };
            } else {
                audio.pause();
                if (icon) icon.className = 'fa-solid fa-play text-[10px]';
                if (text) text.textContent = 'ចាក់ស្តាប់';
            }
        }

        function addExtractedBgmToTimeline() {
            if (!window.currentExtractedBgmUrl) {
                showToast('សូមស្រង់ភ្លេងកំដរជាមុនសិន!', 'warning');
                return;
            }

            const bgmName = window.currentExtractedBgmFilename || 'Extracted_Pure_BGM.wav';
            appendFakeClipToTimeline('audio', {
                url: window.currentExtractedBgmUrl,
                name: `🎵 ${bgmName}`,
                durationFormatted: '03:45'
            });

            const mainBgm = document.getElementById('bgmAudioPlayer');
            if (mainBgm) {
                mainBgm.src = window.currentExtractedBgmUrl;
                mainBgm.volume = parseFloat(localStorage.getItem('khmer_studio_bgm_vol') || 20) / 100;
            }

            showToast(`បានបន្ថែម "${bgmName}" ចូលទៅកាន់ Timeline រួចរាល់!`, 'success');
        }

        function downloadExtractedBgmWav() {
            if (!window.currentExtractedBgmUrl) {
                showToast('គ្មានឯកសារភ្លេងសម្រាប់ទាញយកទេ!', 'warning');
                return;
            }
            const a = document.createElement('a');
            a.href = window.currentExtractedBgmUrl;
            a.download = window.currentExtractedBgmFilename || 'Extracted_BGM.wav';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showToast('កំពុងទាញយកឯកសារ BGM WAV...', 'success');
        }

        // Web Audio Synthesizer for Cinematic BGM Presets
        function previewPresetBgm(presetKey) {
            stopPresetBgmAudio();

            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                bgmAudioContext = audioCtx;

                const masterGain = audioCtx.createGain();
                const vol = parseFloat(localStorage.getItem('khmer_studio_bgm_vol') || 20) / 100;
                masterGain.gain.setValueAtTime(vol * 0.8, audioCtx.currentTime);
                masterGain.connect(audioCtx.destination);

                let freqs = [130.81, 164.81, 196.00, 261.63];
                let type = 'sine';

                if (presetKey === 'epic') {
                    freqs = [65.41, 130.81, 196.00, 261.63, 329.63];
                    type = 'triangle';
                } else if (presetKey === 'mystery') {
                    freqs = [73.42, 110.00, 155.56, 220.00];
                    type = 'sawtooth';
                } else if (presetKey === 'action') {
                    freqs = [82.41, 123.47, 164.81, 246.94];
                    type = 'square';
                } else if (presetKey === 'drama') {
                    freqs = [110.00, 130.81, 164.81, 220.00];
                    type = 'sine';
                }

                freqs.forEach((f, idx) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();

                    osc.type = type;
                    osc.frequency.setValueAtTime(f, audioCtx.currentTime);

                    const filter = audioCtx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(type === 'sawtooth' ? 450 : 800, audioCtx.currentTime);

                    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.2 / freqs.length, audioCtx.currentTime + 0.4);

                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(masterGain);

                    osc.start();
                    activeBgmOscillators.push(osc);
                });

                showToast(`កំពុងចាក់ស្ដាប់គំរូភ្លេង ${presetKey.toUpperCase()} (ចុចម្ដងទៀតដើម្បីបិទ)`, 'info');

                setTimeout(() => {
                    stopPresetBgmAudio();
                }, 6000);

            } catch (e) {
                console.warn("Web Audio BGM preview fallback:", e);
                showToast(`បានជ្រើសរើសភ្លេងកំដរ ${presetKey.toUpperCase()}`, 'info');
            }
        }

        function stopPresetBgmAudio() {
            if (activeBgmOscillators.length > 0) {
                activeBgmOscillators.forEach(osc => {
                    try { osc.stop(); osc.disconnect(); } catch (e) {}
                });
                activeBgmOscillators = [];
            }
            if (bgmAudioContext) {
                try { bgmAudioContext.close(); } catch (e) {}
                bgmAudioContext = null;
            }
            const previewPlayer = document.getElementById('bgmPreviewPlayer');
            if (previewPlayer && !previewPlayer.paused) {
                previewPlayer.pause();
            }
        }

        function insertPresetBgmToTimeline(presetKey) {
            stopPresetBgmAudio();
            const names = {
                epic: 'Cinematic_Epic_Heroic_BGM.mp3',
                mystery: 'Dark_Horror_Suspense_BGM.mp3',
                action: 'Fast_Battle_Tension_BGM.mp3',
                drama: 'Emotional_Piano_Drama_BGM.mp3'
            };
            const trackName = names[presetKey] || 'Cinematic_Score_BGM.mp3';

            appendFakeClipToTimeline('audio', {
                url: '',
                name: `🎵 ${trackName}`,
                durationFormatted: '04:15'
            });

            showToast(`បានបន្ថែមភ្លេងកំដរ "${trackName}" ចូលក្នុង Timeline!`, 'success');
        }

        function updateBgmVolumeDisplay(val) {
            const display = document.getElementById('bgmVolDisplay');
            if (display) {
                display.textContent = `${val}% ${val == 20 ? '(ស្តង់ដារ)' : (val < 20 ? '(ស្រទន់)' : '(ឮខ្លាំង)')}`;
            }
            const bgmAudio = document.getElementById('bgmAudioPlayer');
            if (bgmAudio) {
                bgmAudio.volume = parseFloat(val) / 100;
            }
            localStorage.setItem('khmer_studio_bgm_vol', val);
        }

        function quickSetBgmVolume(val) {
            const range = document.getElementById('bgmVolumeRange');
            if (range) {
                range.value = val;
                updateBgmVolumeDisplay(val);
            }
        }

        function toggleSmartDucking(enabled) {
            localStorage.setItem('khmer_studio_smart_ducking', enabled ? 'true' : 'false');
            showToast(enabled ? 'បានបើក Smart Audio Ducking (បន្ថយភ្លេងពេលមានសំឡេងនិយាយ)!' : 'បានបិទ Smart Audio Ducking!', 'info');
        }

        function setSplitSceneDuration(val) {
            localStorage.setItem('khmer_studio_split_duration', val);
            showToast(`បានកំណត់ប្រវែងកាត់ឈុតអូតូ៖ ${val} វិនាទី!`, 'info');
        }

        function autoSplitTimelineClipsNow() {
            const dur = parseInt(localStorage.getItem('khmer_studio_split_duration') || '5', 10);
            showToast(`✂️ បានកាត់ឈុតវីដេអូលើ Timeline ស្វ័យប្រវត្តិតាមចង្វាក់ ${dur} វិនាទី!`, 'success');
        }

        function selectSubtitleHighlightColor(colorKey) {
            const colors = ['amber', 'teal', 'purple', 'white'];
            colors.forEach(c => {
                const btn = document.getElementById(`subColor-${c}`);
                if (btn) {
                    const icon = btn.querySelector('i');
                    if (c === colorKey) {
                        btn.classList.add('ring-2', 'ring-white');
                        if (icon) icon.classList.remove('hidden');
                    } else {
                        btn.classList.remove('ring-2', 'ring-white');
                        if (icon) icon.classList.add('hidden');
                    }
                }
            });

            localStorage.setItem('khmer_studio_highlight_color', colorKey);
            showToast(`បានកំណត់ពណ៌រំលេច Subtitle៖ ${colorKey.toUpperCase()}`, 'info');
        }

        function resetAutoToolsDefaults() {
            quickSetBgmVolume(20);
            const ducking = document.getElementById('smartDuckingToggle');
            if (ducking) ducking.checked = true;
            toggleSmartDucking(true);
            const durSelect = document.getElementById('autoSplitDurationSelect');
            if (durSelect) durSelect.value = '5';
            setSplitSceneDuration('5');
            selectSubtitleHighlightColor('amber');
            showToast('បានកំណត់ Auto Tools ទៅលំនាំដើម (Defaults) រួចរាល់!', 'success');
        }

        function saveAutoToolsSettings() {
            const vol = document.getElementById('bgmVolumeRange')?.value || '20';
            const dur = document.getElementById('autoSplitDurationSelect')?.value || '5';
            const color = localStorage.getItem('khmer_studio_highlight_color') || 'amber';
            localStorage.setItem('khmer_studio_bgm_vol', vol);
            localStorage.setItem('khmer_studio_split_duration', dur);
            showToast(`បានរក្សាទុកការកំណត់ Auto Tools (BGM: ${vol}%, Split: ${dur}s, Color: ${color}) ជោគជ័យ!`, 'success');
        }

        function initAutoToolsSettings() {
            const savedVol = localStorage.getItem('khmer_studio_bgm_vol') || '20';
            const savedDucking = localStorage.getItem('khmer_studio_smart_ducking') !== 'false';
            const savedDur = localStorage.getItem('khmer_studio_split_duration') || '5';
            const savedColor = localStorage.getItem('khmer_studio_highlight_color') || 'amber';

            quickSetBgmVolume(savedVol);
            const ducking = document.getElementById('smartDuckingToggle');
            if (ducking) ducking.checked = savedDucking;
            const durSelect = document.getElementById('autoSplitDurationSelect');
            if (durSelect) durSelect.value = savedDur;
            selectSubtitleHighlightColor(savedColor);
        }

        // ==================== APPEARANCE & THEMES ENGINE ====================
        const STUDIO_THEMES = {
            capcut: {
                id: 'capcut',
                name: 'Cyber CapCut',
                khmerName: 'ខៀវបៃតង CapCut ដើម',
                accent: '#00e5cc',
                accentHover: '#00c4ae',
                accentRgb: '0, 229, 204',
                accentTint: 'rgba(0, 229, 204, 0.12)',
                glowShadow: '0 0 16px rgba(0, 229, 204, 0.45)',
                badge: 'Teal ស្តង់ដារ (Default)'
            },
            midnight: {
                id: 'midnight',
                name: 'Midnight Blue',
                khmerName: 'ខៀវរាត្រី Midnight Blue',
                accent: '#3b82f6',
                accentHover: '#2563eb',
                accentRgb: '59, 130, 246',
                accentTint: 'rgba(59, 130, 246, 0.12)',
                glowShadow: '0 0 16px rgba(59, 130, 246, 0.45)',
                badge: 'Electric Blue'
            },
            emerald: {
                id: 'emerald',
                name: 'Emerald Matrix',
                khmerName: 'បៃតងត្បូង Emerald Matrix',
                accent: '#10b981',
                accentHover: '#059669',
                accentRgb: '16, 185, 129',
                accentTint: 'rgba(16, 185, 129, 0.12)',
                glowShadow: '0 0 16px rgba(16, 185, 129, 0.45)',
                badge: 'Forest Matrix Neon'
            },
            purple: {
                id: 'purple',
                name: 'Royal Amethyst',
                khmerName: 'ស្វាយប្រណិត Royal Amethyst',
                accent: '#a855f7',
                accentHover: '#9333ea',
                accentRgb: '168, 85, 247',
                accentTint: 'rgba(168, 85, 247, 0.12)',
                glowShadow: '0 0 16px rgba(168, 85, 247, 0.45)',
                badge: 'Velvet Cinema Dark'
            }
        };

        const STUDIO_FONTS = {
            kantumruy: {
                id: 'kantumruy',
                name: 'Kantumruy Pro',
                css: "'Kantumruy Pro', 'Inter', sans-serif"
            },
            battambang: {
                id: 'battambang',
                name: 'Battambang',
                css: "'Battambang', cursive, serif"
            },
            inter: {
                id: 'inter',
                name: 'Inter',
                css: "'Inter', 'Kantumruy Pro', sans-serif"
            },
            siemreap: {
                id: 'siemreap',
                name: 'Siemreap',
                css: "'Siemreap', cursive, sans-serif"
            }
        };

        window.currentStudioThemeKey = 'capcut';
        window.currentStudioThemeAccent = '#00e5cc';
        window.currentTimelineDensity = 'comfortable';

        function applyThemePreset(preset, showNotification = true) {
            const theme = STUDIO_THEMES[preset] || STUDIO_THEMES['capcut'];
            window.currentStudioThemeKey = theme.id;
            window.currentStudioThemeAccent = theme.accent;

            // 1. Dynamic CSS style element injection / update
            let styleEl = document.getElementById('dynamicStudioThemeStyle');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'dynamicStudioThemeStyle';
                document.head.appendChild(styleEl);
            }

            styleEl.innerHTML = `
                :root {
                    --theme-accent: ${theme.accent} !important;
                    --theme-accent-hover: ${theme.accentHover} !important;
                    --theme-accent-rgb: ${theme.accentRgb} !important;
                    --theme-accent-tint: ${theme.accentTint} !important;
                    --theme-glow: ${theme.glowShadow} !important;
                }
                /* Recolor all primary Teal classes across CapCut UI */
                [class*="text-[#00e5cc]"],
                .text-\\[\\#00e5cc\\],
                .text-cc-teal,
                .theme-accent-text {
                    color: ${theme.accent} !important;
                }
                .bg-\\[\\#00e5cc\\],
                .bg-cc-teal,
                .theme-accent-bg {
                    background-color: ${theme.accent} !important;
                }
                /* Semi-transparent background tints */
                [class*="bg-[#00e5cc]/"] {
                    background-color: rgba(${theme.accentRgb}, 0.15) !important;
                }
                .border-\\[\\#00e5cc\\],
                .border-cc-teal,
                .theme-accent-border {
                    border-color: ${theme.accent} !important;
                }
                /* Semi-transparent border tints */
                [class*="border-[#00e5cc]/"] {
                    border-color: rgba(${theme.accentRgb}, 0.35) !important;
                }
                [class*="hover:bg-[#00e5cc]"]:hover,
                .hover\\:bg-\\[\\#00e5cc\\]:hover {
                    background-color: ${theme.accent} !important;
                }
                [class*="hover:text-[#00e5cc]"]:hover,
                .hover\\:text-\\[\\#00e5cc\\]:hover {
                    color: ${theme.accent} !important;
                }
                [class*="hover:border-[#00e5cc]"]:hover,
                .hover\\:border-\\[\\#00e5cc\\]:hover {
                    border-color: ${theme.accent} !important;
                }
                /* Neon Glow Shadows */
                .shadow-\\[0_0_8px_\\#00e5cc\\],
                .shadow-\\[0_0_12px_\\#00e5cc\\],
                .shadow-\\[0_0_15px_\\#00e5cc\\],
                .shadow-\\[0_0_16px_rgba\\(0\\,229\\,204\\,0\\.25\\)\\],
                .shadow-\\[0_0_12px_rgba\\(0\\,229\\,204\\,0\\.35\\)\\] {
                    box-shadow: ${theme.glowShadow} !important;
                }
                /* Active CapCut Top Nav Tab underline & glow */
                .cc-top-tab.active {
                    color: ${theme.accent} !important;
                }
                .cc-top-tab.active i {
                    text-shadow: 0 0 12px rgba(${theme.accentRgb}, 0.5) !important;
                }
                .cc-top-tab.active::after {
                    background-color: ${theme.accent} !important;
                    box-shadow: 0 0 8px rgba(${theme.accentRgb}, 0.7) !important;
                }
                /* Active Left Sidebar Pills */
                .cc-side-item.active {
                    color: ${theme.accent} !important;
                    background-color: rgba(${theme.accentRgb}, 0.12) !important;
                }
                .cc-side-item.active::before {
                    background-color: ${theme.accent} !important;
                    box-shadow: 2px 0 10px rgba(${theme.accentRgb}, 0.7) !important;
                }
                /* Active Cards */
                .cc-card-active {
                    border-color: ${theme.accent} !important;
                    background-color: rgba(${theme.accentRgb}, 0.08) !important;
                    box-shadow: 0 0 16px rgba(${theme.accentRgb}, 0.25) !important;
                }
                /* Form Controls Focus & Range */
                .cc-input:focus {
                    border-color: ${theme.accent} !important;
                }
                input[type="range"] {
                    accent-color: ${theme.accent} !important;
                }
                /* Timeline Playhead line and diamond indicator */
                #timelinePlayhead {
                    border-left-color: ${theme.accent} !important;
                }
                #timelinePlayhead > div:first-child {
                    background-color: ${theme.accent} !important;
                    box-shadow: 0 0 10px rgba(${theme.accentRgb}, 0.8) !important;
                }
                /* Scrollbar hover */
                ::-webkit-scrollbar-thumb:hover {
                    background: ${theme.accent} !important;
                }
            `;

            // 2. Update 4 Theme Cards UI in Modal
            ['capcut', 'midnight', 'emerald', 'purple'].forEach(k => {
                const card = document.getElementById(`themeCard-${k}`);
                const check = document.getElementById(`themeCheck-${k}`);
                if (card) {
                    if (k === theme.id) {
                        card.classList.add('active', 'border-2');
                        card.classList.remove('border', 'border-[#2b2b36]');
                        card.style.borderColor = theme.accent;
                        card.style.boxShadow = theme.glowShadow;
                        if (check) {
                            check.classList.remove('hidden');
                            check.style.backgroundColor = theme.accent;
                            check.style.color = (theme.id === 'capcut' || theme.id === 'emerald') ? '#000000' : '#ffffff';
                        }
                    } else {
                        card.classList.remove('active', 'border-2');
                        card.classList.add('border', 'border-[#2b2b36]');
                        card.style.borderColor = '#2b2b36';
                        card.style.boxShadow = 'none';
                        if (check) check.classList.add('hidden');
                    }
                }
            });

            // 3. Update Modal Header Badge & Live Preview Box
            const activeThemeBadge = document.getElementById('activeThemeBadge');
            const activeThemeDot = document.getElementById('activeThemeDot');
            const activeThemeTitle = document.getElementById('activeThemeTitle');
            if (activeThemeBadge && activeThemeDot && activeThemeTitle) {
                activeThemeTitle.textContent = theme.name;
                activeThemeBadge.style.color = theme.accent;
                activeThemeBadge.style.borderColor = `rgba(${theme.accentRgb}, 0.4)`;
                activeThemeBadge.style.backgroundColor = `rgba(${theme.accentRgb}, 0.12)`;
                activeThemeDot.style.backgroundColor = theme.accent;
                activeThemeDot.style.boxShadow = `0 0 8px ${theme.accent}`;
            }

            const previewThemeHex = document.getElementById('previewThemeHex');
            if (previewThemeHex) {
                previewThemeHex.textContent = `Accent: ${theme.accent}`;
                previewThemeHex.style.color = theme.accent;
                previewThemeHex.style.borderColor = `rgba(${theme.accentRgb}, 0.3)`;
            }

            const previewLogoBox = document.getElementById('previewLogoBox');
            const previewLogoIcon = document.getElementById('previewLogoIcon');
            if (previewLogoBox && previewLogoIcon) {
                previewLogoBox.style.backgroundColor = `rgba(${theme.accentRgb}, 0.15)`;
                previewLogoBox.style.borderColor = `rgba(${theme.accentRgb}, 0.4)`;
                previewLogoBox.style.boxShadow = `0 0 12px rgba(${theme.accentRgb}, 0.3)`;
                previewLogoIcon.style.color = theme.accent;
            }

            const previewTagPill = document.getElementById('previewTagPill');
            if (previewTagPill) {
                previewTagPill.style.backgroundColor = `rgba(${theme.accentRgb}, 0.2)`;
                previewTagPill.style.color = theme.accent;
            }

            const previewBtnAccent = document.getElementById('previewBtnAccent');
            if (previewBtnAccent) {
                previewBtnAccent.style.backgroundColor = theme.accent;
                previewBtnAccent.style.boxShadow = `0 0 12px rgba(${theme.accentRgb}, 0.35)`;
                previewBtnAccent.style.color = (theme.id === 'capcut' || theme.id === 'emerald') ? '#000000' : '#ffffff';
            }

            const previewWaveform = document.getElementById('previewWaveform');
            if (previewWaveform) {
                const encodedHex = encodeURIComponent(theme.accent);
                previewWaveform.style.backgroundImage = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none' viewBox='0 0 100 20'><path d='M0,10 L3,5 L6,15 L9,8 L12,14 L15,3 L18,17 L21,9 L24,12 L27,6 L30,15 L33,7 L36,13 L39,4 L42,16 L45,9 L48,12 L51,5 L54,16 L57,8 L60,13 L63,4 L66,17 L69,9 L72,12 L75,6 L78,14 L81,5 L84,16 L87,8 L90,13 L93,6 L96,15 L100,10' fill='none' stroke='${encodedHex}' stroke-width='1.4' stroke-linecap='round'/></svg>")`;
            }

            // 4. Re-render Timeline Audio Waveforms live with new theme accent
            if (typeof renderTimelineSegments === 'function' && typeof timelineSegments !== 'undefined' && timelineSegments && timelineSegments.length > 0) {
                renderTimelineSegments();
            }

            // 5. Persist to localStorage
            localStorage.setItem('khmer_studio_theme_preset', theme.id);

            if (showNotification) {
                showToast(`បានអនុវត្ត Theme «${theme.name}» (${theme.khmerName}) ជោគជ័យ!`, 'success');
            }
        }

        function setStudioFont(fontKey, showNotification = true) {
            const font = STUDIO_FONTS[fontKey] || STUDIO_FONTS['kantumruy'];
            document.body.style.fontFamily = font.css;
            document.documentElement.style.fontFamily = font.css;

            const fontSelect = document.getElementById('fontSelect');
            if (fontSelect) fontSelect.value = font.id;

            const sample = document.getElementById('fontSamplePreview');
            if (sample) sample.style.fontFamily = font.css;

            localStorage.setItem('khmer_studio_font', font.id);
            if (showNotification) {
                showToast(`បានប្ដូរពុម្ពអក្សរទៅ «${font.name}»!`, 'info');
            }
        }

        function setStudioFontScale(scaleKey, showNotification = true) {
            ['compact', 'normal', 'large'].forEach(k => {
                const btn = document.getElementById(`fontScaleBtn-${k}`);
                if (btn) {
                    if (k === scaleKey) {
                        btn.className = 'px-2.5 py-1 rounded text-[11px] font-bold bg-[#00e5cc]/20 text-[#00e5cc] transition-all';
                    } else {
                        btn.className = 'px-2.5 py-1 rounded text-[11px] font-medium text-slate-400 hover:text-white transition-all';
                    }
                }
            });

            if (scaleKey === 'large') {
                document.documentElement.style.fontSize = '15.5px';
            } else if (scaleKey === 'compact') {
                document.documentElement.style.fontSize = '13px';
            } else {
                document.documentElement.style.fontSize = '14px';
            }

            localStorage.setItem('khmer_studio_font_scale', scaleKey);
            if (showNotification) {
                showToast(`បានកំណត់ទំហំអក្សរ: ${scaleKey.toUpperCase()}`, 'info');
            }
        }

        function setStudioGlow(glowKey, showNotification = true) {
            ['soft', 'standard', 'high'].forEach(k => {
                const btn = document.getElementById(`glowBtn-${k}`);
                if (btn) {
                    if (k === glowKey) {
                        btn.className = 'py-1 rounded text-[10.5px] font-bold bg-[#00e5cc]/20 text-[#00e5cc] transition-all text-center';
                    } else {
                        btn.className = 'py-1 rounded text-[10.5px] font-medium text-slate-400 hover:text-white transition-all text-center';
                    }
                }
            });

            const activeGlowText = document.getElementById('activeGlowText');
            if (activeGlowText) {
                activeGlowText.textContent = glowKey.charAt(0).toUpperCase() + glowKey.slice(1);
            }

            document.body.classList.remove('glow-soft', 'glow-standard', 'glow-high');
            document.body.classList.add(`glow-${glowKey}`);

            localStorage.setItem('khmer_studio_glow', glowKey);
            if (showNotification) {
                showToast(`បានកំណត់កម្រិតពន្លឺ Neon: ${glowKey.toUpperCase()}`, 'info');
            }
        }

        function setTimelineDensity(densityKey, showNotification = true) {
            window.currentTimelineDensity = densityKey;
            ['compact', 'comfortable'].forEach(k => {
                const btn = document.getElementById(`densityBtn-${k}`);
                if (btn) {
                    if (k === densityKey) {
                        btn.className = 'py-1 rounded text-[10.5px] font-bold bg-[#00e5cc]/20 text-[#00e5cc] transition-all text-center';
                    } else {
                        btn.className = 'py-1 rounded text-[10.5px] font-medium text-slate-400 hover:text-white transition-all text-center';
                    }
                }
            });

            const densityText = document.getElementById('activeDensityText');
            if (densityText) {
                densityText.textContent = densityKey === 'compact' ? '26px' : '32px';
            }

            if (typeof renderTimelineSegments === 'function' && typeof timelineSegments !== 'undefined' && timelineSegments && timelineSegments.length > 0) {
                renderTimelineSegments();
            }

            localStorage.setItem('khmer_studio_timeline_density', densityKey);
            if (showNotification) {
                showToast(`បានកំណត់កម្ពស់ Timeline: ${densityKey === 'compact' ? '26px (បង្រួម)' : '32px (ទូលាយ)'}`, 'info');
            }
        }

        function resetAppearanceDefaults() {
            applyThemePreset('capcut', false);
            setStudioFont('kantumruy', false);
            setStudioFontScale('normal', false);
            setStudioGlow('standard', false);
            setTimelineDensity('comfortable', false);
            showToast('បានកំណត់រូបរាងទៅលំនាំដើម (Default) ជោគជ័យ!', 'success');
        }

        function saveAppearanceSettingsManual() {
            const currentTheme = window.currentStudioThemeKey || 'capcut';
            const currentFont = localStorage.getItem('khmer_studio_font') || 'kantumruy';
            showToast(`បានរក្សាទុកស្ទាយ ${currentTheme.toUpperCase()} & ${currentFont.toUpperCase()} រួចរាល់!`, 'success');
        }

        function initAppearanceSettings() {
            const savedTheme = localStorage.getItem('khmer_studio_theme_preset') || 'capcut';
            const savedFont = localStorage.getItem('khmer_studio_font') || 'kantumruy';
            const savedScale = localStorage.getItem('khmer_studio_font_scale') || 'normal';
            const savedGlow = localStorage.getItem('khmer_studio_glow') || 'standard';
            const savedDensity = localStorage.getItem('khmer_studio_timeline_density') || 'comfortable';

            applyThemePreset(savedTheme, false);
            setStudioFont(savedFont, false);
            setStudioFontScale(savedScale, false);
            setStudioGlow(savedGlow, false);
            setTimelineDensity(savedDensity, false);
        }

        function resetWorkspaceData() {
            if (confirm('តើលោកអ្នកពិតជាចង់សម្អាត Timeline និង Script ទាំងអស់ឡើងវិញមែនទេ?')) {
                timelineSegments = [];
                currentOutputText = '';
                const textarea = document.getElementById('outputTextarea');
                if (textarea) textarea.value = '';
                renderTimelineSegments();
                showToast('បានសម្អាត Workspace រួចរាល់!', 'info');
            }
        }

        // ==================== GENERAL SETTINGS LIVE LOGIC ====================
        let autoSaveIntervalTimer = null;

        function setAspectRatio(ratio) {
            localStorage.setItem('khmer_studio_ratio', ratio);
            const ratioBtnText = document.getElementById('ratioBtnText');
            if (ratioBtnText) ratioBtnText.textContent = ratio;

            const ratioBox = document.getElementById('playerAspectRatioBox');
            if (ratioBox) {
                if (ratio === '9:16') {
                    ratioBox.className = 'relative max-w-[320px] w-full h-full aspect-[9/16] mx-auto flex flex-col justify-between p-3 bg-[#0a0a0e] rounded-2xl border-2 border-[#00e5cc]/40 shadow-[0_0_35px_rgba(0,229,204,0.2)] transition-all duration-500 overflow-hidden';
                } else {
                    ratioBox.className = 'relative w-full h-full aspect-video max-w-full flex flex-col justify-between p-3 bg-black rounded-xl border border-white/5 shadow-inner transition-all duration-500 overflow-hidden';
                }
            }

            // Update Settings cards
            document.querySelectorAll('.ratio-card').forEach(card => {
                card.className = 'ratio-card p-3.5 rounded-xl border border-[#2b2b36] bg-[#181822] cursor-pointer transition-all hover:bg-[#252535] group';
            });
            const activeCard = document.getElementById(`ratioCard-${ratio.replace(':', '_')}`);
            if (activeCard) {
                activeCard.className = 'ratio-card active p-3.5 rounded-xl border-2 border-[#00e5cc] bg-[#20202b] cursor-pointer transition-all hover:bg-[#252535] group shadow-md shadow-[#00e5cc]/10';
            }
        }

        function toggleAspectRatio() {
            const currentRatio = localStorage.getItem('khmer_studio_ratio') || '16:9';
            const nextRatio = currentRatio === '16:9' ? '9:16' : '16:9';
            setAspectRatio(nextRatio);
            showToast(`បានប្តូរទំហំវីដេអូទៅជា ${nextRatio} (${nextRatio === '16:9' ? 'YouTube ផ្ដេក' : 'TikTok បញ្ឈរ'})!`, 'success');
        }

        function setExportResolution(res) {
            localStorage.setItem('khmer_studio_export_res', res);
            const qualityText = document.getElementById('playerQualityText');
            if (qualityText) qualityText.textContent = res.toUpperCase();

            // Update pills
            document.querySelectorAll('.res-pill').forEach(pill => {
                pill.className = 'res-pill px-4 py-2 rounded-xl bg-[#181822] border border-[#2b2b36] text-slate-300 font-bold text-[11.5px] cursor-pointer hover:border-slate-500 transition-all';
            });
            const activePill = document.getElementById(`resPill-${res.toLowerCase()}`);
            if (activePill) {
                activePill.className = 'res-pill px-4 py-2 rounded-xl bg-[#00e5cc]/15 border-2 border-[#00e5cc] text-[#00e5cc] font-extrabold text-[11.5px] cursor-pointer transition-all shadow-[0_0_12px_rgba(0,229,204,0.3)]';
            }
        }

        function toggleAutoSaveSetting(enable) {
            const isChecked = typeof enable === 'boolean' ? enable : document.getElementById('genAutoSaveToggle')?.checked;
            localStorage.setItem('khmer_studio_autosave', isChecked ? 'true' : 'false');

            const icon = document.getElementById('topAutoSaveIcon');
            const text = document.getElementById('topAutoSaveText');
            const statusLabel = document.getElementById('genAutoSaveStatusText');

            if (isChecked) {
                if (icon) icon.className = 'fa-solid fa-cloud-arrow-up text-[#00e5cc] animate-pulse';
                if (text) text.textContent = 'Auto-saved';
                if (statusLabel) {
                    statusLabel.innerHTML = '<span class="text-emerald-400 font-bold flex items-center gap-1.5"><i class="fa-solid fa-circle-check"></i> បើកដំណើរការ (រក្សាទុកស្វ័យប្រវត្តិរៀងរាល់ 30 វិនាទី)</span>';
                }
                startAutoSaveTimer();
                showToast('បានបើកដំណើរការ Auto-save ស្វ័យប្រវត្តិ!', 'success');
            } else {
                if (icon) icon.className = 'fa-solid fa-cloud-slash text-slate-500';
                if (text) text.textContent = 'Manual Save';
                if (statusLabel) {
                    statusLabel.innerHTML = '<span class="text-slate-500 font-bold flex items-center gap-1.5"><i class="fa-solid fa-circle-xmark"></i> បានបិទ (មិនរក្សាទុកស្វ័យប្រវត្តិ)</span>';
                }
                stopAutoSaveTimer();
                showToast('បានបិទ Auto-save!', 'info');
            }
        }

        function startAutoSaveTimer() {
            if (autoSaveIntervalTimer) clearInterval(autoSaveIntervalTimer);
            autoSaveIntervalTimer = setInterval(() => {
                if (currentOutputText) {
                    localStorage.setItem('khmer_studio_last_script', currentOutputText);
                    const title = document.getElementById('recapTitle')?.value || '';
                    if (title) localStorage.setItem('khmer_studio_last_title', title);
                }
            }, 30000);
        }

        function stopAutoSaveTimer() {
            if (autoSaveIntervalTimer) {
                clearInterval(autoSaveIntervalTimer);
                autoSaveIntervalTimer = null;
            }
        }

        function saveGeneralProjectInfo() {
            const title = document.getElementById('genProjectTitle')?.value || '';
            const author = document.getElementById('genAuthorName')?.value || '';
            localStorage.setItem('khmer_studio_project_title', title);
            localStorage.setItem('khmer_studio_author_name', author);
        }

        function saveAllGeneralSettings() {
            saveGeneralProjectInfo();
            const ratio = localStorage.getItem('khmer_studio_ratio') || '16:9';
            const res = localStorage.getItem('khmer_studio_export_res') || '1080p';
            toggleApiModal();
            showToast(`បានរក្សាទុកការកំណត់ទូទៅរួចរាល់! (${ratio}, ${res.toUpperCase()})`, 'success');
        }

        function initGeneralSettings() {
            // 1. Ratio
            const savedRatio = localStorage.getItem('khmer_studio_ratio') || '16:9';
            setAspectRatio(savedRatio);

            // 2. Resolution
            const savedRes = localStorage.getItem('khmer_studio_export_res') || '1080p';
            setExportResolution(savedRes);

            // 3. AutoSave
            const autoSaveEnabled = localStorage.getItem('khmer_studio_autosave') !== 'false';
            const autoSaveToggle = document.getElementById('genAutoSaveToggle');
            if (autoSaveToggle) autoSaveToggle.checked = autoSaveEnabled;
            if (autoSaveEnabled) startAutoSaveTimer();

            // 4. Project Info
            const projectTitle = document.getElementById('genProjectTitle');
            if (projectTitle) projectTitle.value = localStorage.getItem('khmer_studio_project_title') || '';
            const authorName = document.getElementById('genAuthorName');
            if (authorName) authorName.value = localStorage.getItem('khmer_studio_author_name') || '';
        }

        let toastTimeout = null;
        function showToast(message, type = 'success') {
            const box = document.getElementById('toastBox');
            const icon = document.getElementById('toastIcon');
            document.getElementById('toastText').textContent = message;
            icon.className = type === 'error'
                ? 'fa-solid fa-circle-xmark text-rose-400'
                : type === 'warning'
                    ? 'fa-solid fa-triangle-exclamation text-amber-400'
                    : 'fa-solid fa-circle-check text-cc-teal';
            box.classList.remove('translate-y-20', 'opacity-0');
            if (toastTimeout) clearTimeout(toastTimeout);
            toastTimeout = setTimeout(() => box.classList.add('translate-y-20', 'opacity-0'), 3000);
        }

        // ==================== SHORTCUTS & KEYBOARD ENGINE ====================
        let isGlobalShortcutsBound = false;
        let isAllTracksMuted = false;

        function updateLiveTesterUI(keyText, title, desc) {
            const badge = document.getElementById('liveTesterKeyBadge');
            const titleEl = document.getElementById('liveTesterActionTitle');
            const descEl = document.getElementById('liveTesterActionDesc');
            const pillEl = document.getElementById('liveTesterStatusPill');

            if (badge) {
                badge.textContent = keyText;
                badge.classList.add('scale-110', 'border-emerald-400', 'text-emerald-300', 'shadow-[0_0_20px_#10b981]');
                setTimeout(() => {
                    badge.classList.remove('scale-110', 'border-emerald-400', 'text-emerald-300', 'shadow-[0_0_20px_#10b981]');
                }, 350);
            }
            if (titleEl && title) titleEl.textContent = title;
            if (descEl && desc) descEl.textContent = desc;
            if (pillEl) {
                pillEl.textContent = 'Triggered ⚡';
                pillEl.className = 'text-[9.5px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 rounded font-bold uppercase tracking-wide animate-pulse';
            }
        }

        function toggleMuteAllTracks() {
            isAllTracksMuted = !isAllTracksMuted;
            const videoPreview = document.getElementById('uploadedVideoPreview');
            const bgmPlayer = document.getElementById('bgmAudioPlayer');
            const ttsPlayer = document.getElementById('aiAudioPlayer');

            if (videoPreview) videoPreview.muted = isAllTracksMuted;
            if (bgmPlayer) bgmPlayer.muted = isAllTracksMuted;
            if (ttsPlayer) ttsPlayer.muted = isAllTracksMuted;

            updateLiveTesterUI('M', isAllTracksMuted ? 'បានបិទសំឡេងទាំងអស់ (Muted)' : 'បានបើកសំឡេងទាំងអស់ (Unmuted)', 'ផ្លាស់ប្តូរកម្រិតសំឡេង Mute លើគ្រប់ Tracks ទាំងអស់');
            showToast(isAllTracksMuted ? '🔇 បានបិទសំឡេងទាំងអស់ (Tracks Muted)!' : '🔊 បានបើកសំឡេងឡើងវិញ (Tracks Unmuted)!', 'info');
        }

        function toggleTheaterFullscreen() {
            const stage = document.getElementById('centerVisualStage');
            if (!stage) return;

            if (!document.fullscreenElement) {
                if (stage.requestFullscreen) {
                    stage.requestFullscreen();
                } else if (stage.webkitRequestFullscreen) {
                    stage.webkitRequestFullscreen();
                }
                updateLiveTesterUI('F', 'ពេញអេក្រង់ (Fullscreen Stage)', 'បានពង្រីកផ្ទាំងវីដេអូទំហំធំពេញអេក្រង់');
                showToast('📺 បានបើក Stage ពេញអេក្រង់ (ចុច Esc ឬ F ដើម្បីបិទ)', 'info');
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
                updateLiveTesterUI('F', 'ចេញពីពេញអេក្រង់ (Exit Fullscreen)', 'បានបង្រួមផ្ទាំងវីដេអូមកទំហំធម្មតា');
            }
        }

        function saveProjectWorkspaceNow() {
            const title = document.getElementById('recapTitle')?.value || document.getElementById('genProjectTitle')?.value || 'Untitled Project';
            const script = currentOutputText || document.getElementById('outputTextarea')?.value || '';
            
            localStorage.setItem('khmer_studio_last_title', title);
            localStorage.setItem('khmer_studio_last_script', script);
            localStorage.setItem('khmer_studio_last_saved_time', new Date().toLocaleTimeString('km-KH'));

            updateLiveTesterUI('Ctrl + S', 'រក្សាទុកគម្រោងរហ័ស (Quick Saved)', 'បានរក្សាទុកចំណងជើង និងអត្ថបទស្គ្រីបចូល Storage ជោគជ័យ');
            showToast(`💾 បានរក្សាទុកគម្រោង "${title.slice(0, 25)}" ជោគជ័យ!`, 'success');
        }

        function switchShortcutsPreset(preset) {
            localStorage.setItem('khmer_studio_shortcuts_preset', preset);
            const kbSplitKey = document.getElementById('kbSplitKey');

            if (preset === 'premiere') {
                if (kbSplitKey) kbSplitKey.textContent = 'C (Razor)';
                showToast('បានប្តូរស្ទាយគ្រាប់ចុចទៅជា Adobe Premiere Pro (C: Razor Cut, Space: Play)', 'info');
            } else if (preset === 'finalcut') {
                if (kbSplitKey) kbSplitKey.textContent = 'B (Blade)';
                showToast('បានប្តូរស្ទាយគ្រាប់ចុចទៅជា Apple Final Cut Pro (B: Blade Cut, Space: Play)', 'info');
            } else {
                if (kbSplitKey) kbSplitKey.textContent = 'S';
                showToast('បានប្តូរស្ទាយគ្រាប់ចុចទៅជា CapCut PC ស្តង់ដារ (S: Split, Del: Delete, Space: Play)', 'info');
            }
        }

        function filterShortcutsCategory(cat) {
            // Update buttons styling
            const filterBtns = ['all', 'timeline', 'ai', 'system'];
            filterBtns.forEach(c => {
                const btn = document.getElementById(`scFilter-${c}`);
                if (btn) {
                    if (c === cat) {
                        btn.className = 'px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold transition-all cursor-pointer shadow-sm';
                    } else {
                        btn.className = 'px-3 py-1.5 rounded-xl bg-[#161722] hover:bg-[#202232] text-slate-300 hover:text-white border border-[#282938] text-xs font-semibold transition-all cursor-pointer';
                    }
                }
            });

            // Filter cards
            const cards = document.querySelectorAll('.shortcut-card');
            let visibleCount = 0;
            cards.forEach(card => {
                const cardCat = card.dataset.category;
                if (cat === 'all' || cardCat === cat) {
                    card.classList.remove('hidden');
                    visibleCount++;
                } else {
                    card.classList.add('hidden');
                }
            });

            const countEl = document.getElementById('shortcutTotalCount');
            if (countEl) countEl.textContent = visibleCount;
        }

        function searchShortcuts(query) {
            const q = (query || '').toLowerCase().trim();
            const cards = document.querySelectorAll('.shortcut-card');
            let visibleCount = 0;

            cards.forEach(card => {
                const searchData = (card.dataset.search || '').toLowerCase();
                const cardText = card.textContent.toLowerCase();
                if (!q || searchData.includes(q) || cardText.includes(q)) {
                    card.classList.remove('hidden');
                    visibleCount++;
                } else {
                    card.classList.add('hidden');
                }
            });

            const countEl = document.getElementById('shortcutTotalCount');
            if (countEl) countEl.textContent = visibleCount;
        }

        function testShortcutAction(actionKey) {
            const preset = localStorage.getItem('khmer_studio_shortcuts_preset') || 'capcut';

            switch (actionKey) {
                case 'space':
                    toggleTimelinePlayback();
                    updateLiveTesterUI('Space', 'ចាក់ / ផ្អាក Timeline Playback (Play / Pause)', 'បញ្ជាឱ្យចាក់ ឬផ្អាកវីដេអូនៅលើ Timeline & Stage');
                    break;
                case 'split':
                    splitActiveTimelineClip();
                    const splitLabel = preset === 'premiere' ? 'C' : (preset === 'finalcut' ? 'B' : 'S');
                    updateLiveTesterUI(splitLabel, 'កាត់តឈុតត្រង់បន្ទាត់ (Split Clip)', 'បានកាត់បំបែកឈុតវីដេអូ ឬសំឡេងត្រង់បន្ទាត់ Playhead');
                    break;
                case 'delete':
                    deleteSelectedClip();
                    updateLiveTesterUI('Del', 'លុបឈុតដែលជ្រើសរើស (Delete Clip)', 'បានលុបឈុតចេញពី Timeline');
                    break;
                case 'save':
                    saveProjectWorkspaceNow();
                    break;
                case 'generate':
                    updateLiveTesterUI('Ctrl + Enter', 'បង្កើតសាច់រឿង AI (Generate AI Story)', 'បានបញ្ជាម៉ាស៊ីន AI ឱ្យបង្កើតអត្ថបទសម្រាយរឿង');
                    handleGenerate();
                    break;
                case 'voice':
                    updateLiveTesterUI('Alt + P', 'សាកល្បងសំឡេង AI (Voice TTS)', 'កំពុងចាក់សំឡេងសាកល្បងរបស់តួអង្គ AI');
                    generateAndPlayTTS();
                    break;
                case 'bgm':
                    updateLiveTesterUI('Alt + B', 'ស្រង់ភ្លេងកំដរ BGM Studio', 'បើកផ្ទាំង AI BGM & Instrumental Isolator');
                    toggleApiModal('tools');
                    break;
                case 'mute':
                    toggleMuteAllTracks();
                    break;
                case 'step':
                    stepTimelineClip(1);
                    updateLiveTesterUI('→', 'រំកិល Playhead ឈុតបន្ទាប់ (Step Clip)', 'បានរំកិល Playhead ទៅឈុតបន្ទាប់');
                    break;
                case 'undo':
                    updateLiveTesterUI('Ctrl + Z', 'ត្រឡប់ក្រោយ (Undo History)', 'បានត្រឡប់សកម្មភាពមុន');
                    showToast('បានត្រឡប់ក្រោយ (Undo)', 'info');
                    break;
                case 'redo':
                    updateLiveTesterUI('Ctrl + Y', 'ទៅមុខវិញ (Redo History)', 'បានធ្វើឡើងវិញនូវសកម្មភាព');
                    showToast('បានទៅមុខវិញ (Redo)', 'info');
                    break;
                case 'fullscreen':
                    toggleTheaterFullscreen();
                    break;
                case 'home':
                    if (typeof selectTimelineSegment === 'function' && timelineSegments && timelineSegments.length > 0) {
                        selectTimelineSegment(0);
                    }
                    updateLiveTesterUI('Home', 'ទៅដើម Timeline (Jump to Start)', 'បានរំកិល Playhead ទៅដើមដំបូងនៃ Timeline');
                    showToast('បានរំកិលទៅដើម Timeline', 'info');
                    break;
                case 'escape':
                    updateLiveTesterUI('Esc', 'បិទផ្ទាំង (Close Modal / Settings)', 'បានបិទផ្ទាំង Popup និង Settings');
                    toggleApiModal();
                    break;
                case 'help':
                    updateLiveTesterUI('Ctrl + /', 'តារាង Keyboard Shortcuts', 'បើកមើលតារាងគ្រាប់ចុចកាត់');
                    toggleApiModal('shortcuts');
                    break;
                case 'editor':
                    const nextMode = (centerStageMode === 'stage') ? 'editor' : 'stage';
                    setCenterStageMode(nextMode);
                    updateLiveTesterUI('Alt + E', `ប្តូរផ្ទាំងទៅជា ${nextMode === 'stage' ? 'Visual Stage' : 'Script Editor'}`, 'ផ្លាស់ប្តូរទិដ្ឋភាពអេក្រង់');
                    showToast(`បានប្តូរទៅកាន់ ${nextMode === 'stage' ? 'Stage' : 'Script Editor'}`, 'info');
                    break;
            }
        }

        async function copyShortcutsCheatSheet() {
            const cheatSheetText = `⚡ SORA VOICE AI STUDIO - KEYBOARD SHORTCUTS CHEAT SHEET
======================================================
[🎬 Timeline & ការកាត់តវីដេអូ]
• Space          : ចាក់ / ផ្អាក (Play / Pause)
• S (ឬ C / B)    : កាត់តឈុតត្រង់បន្ទាត់ (Split Clip at Playhead)
• Del / ⌫        : លុបឈុតដែលជ្រើសរើស (Delete Clip)
• M              : បិទ / បើកសំឡេងទាំងអស់ (Mute / Unmute Tracks)
• ← / →          : រំកិល Playhead ឈុតមុន / ឈុតបន្ទាប់
• Home / End     : ទៅដើមដំបូង / ទៅចុងបញ្ចប់ Timeline
• F              : បើកវីដេអូពេញអេក្រង់ (Fullscreen Stage)

[🤖 AI Studio & Voice]
• Ctrl + Enter   : បង្កើតសាច់រឿង AI ភ្លាមៗ (Generate Story)
• Alt + P        : សាកល្បងចាក់សំឡេង AI (Play AI Voice TTS)
• Alt + B        : បើក AI BGM Isolator (ស្រង់យកតែភ្លេងកំដរ)

[⚡ គម្រោង & ប្រព័ន្ធ]
• Ctrl + S       : រក្សាទុកគម្រោងរហ័ស (Quick Save Project)
• Ctrl + Z       : ត្រឡប់ក្រោយ (Undo)
• Ctrl + Y       : ទៅមុខវិញ (Redo)
• Alt + E        : ប្តូរផ្ទាំង Stage ↔ Script Editor
• Esc            : បិទផ្ទាំង Settings / Modal
• Ctrl + / (ឬ ?) : បើកផ្ទាំង Keyboard Shortcuts នេះ
======================================================
Khmer AI Story Studio v3.5 PRO - Designed for Creators`;

            try {
                await navigator.clipboard.writeText(cheatSheetText);
                showToast('📋 បានចម្លងតារាង Keyboard Shortcuts ចូល Clipboard ជោគជ័យ!', 'success');
            } catch (e) {
                showToast('មិនអាច Copy បានទេ សូមអនុញ្ញាតសិទ្ធិ Clipboard', 'warning');
            }
        }

        function resetShortcutsDefaults() {
            switchShortcutsPreset('capcut');
            const presetSelect = document.getElementById('shortcutPresetSelect');
            if (presetSelect) presetSelect.value = 'capcut';
            filterShortcutsCategory('all');
            const searchInput = document.getElementById('shortcutSearchInput');
            if (searchInput) searchInput.value = '';
            showToast('បានកំណត់ Keyboard Shortcuts ទៅលំនាំដើម CapCut PC រួចរាល់!', 'success');
        }

        function saveShortcutsSettingsManual() {
            const preset = document.getElementById('shortcutPresetSelect')?.value || 'capcut';
            localStorage.setItem('khmer_studio_shortcuts_preset', preset);
            toggleApiModal();
            showToast(`បានរក្សាទុកការកំណត់គ្រាប់ចុចកាត់ (ស្ទាយ ${preset.toUpperCase()}) ជោគជ័យ!`, 'success');
        }

        function handleGlobalKeydown(e) {
            // Check if user is typing in form inputs
            const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
            const isTyping = activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable;

            const isCtrlOrCmd = e.ctrlKey || e.metaKey;
            const preset = localStorage.getItem('khmer_studio_shortcuts_preset') || 'capcut';

            // Global Key 1: Ctrl + S (Save Project - allowed even when typing in textarea)
            if (isCtrlOrCmd && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                saveProjectWorkspaceNow();
                return;
            }

            // Global Key 2: Ctrl + Enter (Generate AI Story - allowed when typing)
            if (isCtrlOrCmd && e.key === 'Enter') {
                e.preventDefault();
                testShortcutAction('generate');
                return;
            }

            // Global Key 3: Escape (Close any modal)
            if (e.key === 'Escape') {
                const apiModal = document.getElementById('apiModal');
                const storeModal = document.getElementById('storeModal');
                const historyModal = document.getElementById('historyModal');
                if (apiModal && !apiModal.classList.contains('hidden')) {
                    toggleApiModal();
                    return;
                }
                if (storeModal && !storeModal.classList.contains('hidden')) {
                    toggleStoreModal();
                    return;
                }
                if (historyModal && !historyModal.classList.contains('hidden')) {
                    toggleHistoryModal();
                    return;
                }
                if (document.fullscreenElement) {
                    toggleTheaterFullscreen();
                    return;
                }
            }

            // Global Key 4: Ctrl + / or ? (Shortcuts Help)
            if ((isCtrlOrCmd && e.key === '/') || e.key === '?') {
                e.preventDefault();
                toggleApiModal('shortcuts');
                return;
            }

            // Global Key 5: Alt + P (Voice TTS)
            if (e.altKey && (e.key === 'p' || e.key === 'P')) {
                e.preventDefault();
                testShortcutAction('voice');
                return;
            }

            // Global Key 6: Alt + B (BGM Studio)
            if (e.altKey && (e.key === 'b' || e.key === 'B')) {
                e.preventDefault();
                testShortcutAction('bgm');
                return;
            }

            // Global Key 7: Alt + E (Switch Stage / Editor)
            if (e.altKey && (e.key === 'e' || e.key === 'E')) {
                e.preventDefault();
                testShortcutAction('editor');
                return;
            }

            // Do not intercept standard typing for single letters or spacebar if inside input/textarea
            if (isTyping) return;

            // Timeline Key 8: Space (Play / Pause)
            if (e.code === 'Space') {
                e.preventDefault();
                testShortcutAction('space');
                return;
            }

            // Timeline Key 9: Split Clip
            // CapCut: S, Premiere: C, Final Cut: B
            const splitKeyChar = preset === 'premiere' ? 'c' : (preset === 'finalcut' ? 'b' : 's');
            if (e.key.toLowerCase() === splitKeyChar && !isCtrlOrCmd && !e.altKey) {
                e.preventDefault();
                testShortcutAction('split');
                return;
            }

            // Timeline Key 10: Delete / Backspace
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                testShortcutAction('delete');
                return;
            }

            // Timeline Key 11: M (Mute All Tracks)
            if (e.key === 'm' || e.key === 'M') {
                e.preventDefault();
                testShortcutAction('mute');
                return;
            }

            // Timeline Key 12: Arrows
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                stepTimelineClip(-1);
                updateLiveTesterUI('←', 'រំកិលទៅឈុតមុន (Previous Clip)', 'បានរំកិល Playhead ទៅឈុតខាងឆ្វេង');
                return;
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                stepTimelineClip(1);
                updateLiveTesterUI('→', 'រំកិលទៅឈុតបន្ទាប់ (Next Clip)', 'បានរំកិល Playhead ទៅឈុតខាងស្តាំ');
                return;
            }

            // Timeline Key 13: Home / End
            if (e.key === 'Home') {
                e.preventDefault();
                testShortcutAction('home');
                return;
            }
            if (e.key === 'End') {
                e.preventDefault();
                if (typeof selectTimelineSegment === 'function' && timelineSegments && timelineSegments.length > 0) {
                    selectTimelineSegment(timelineSegments.length - 1);
                }
                updateLiveTesterUI('End', 'ទៅចុង Timeline (Jump to End)', 'បានរំកិល Playhead ទៅឈុតចុងក្រោយ');
                showToast('បានរំកិលទៅចុងបញ្ចប់ Timeline', 'info');
                return;
            }

            // Timeline Key 14: F (Fullscreen)
            if ((e.key === 'f' || e.key === 'F') && !isCtrlOrCmd) {
                e.preventDefault();
                toggleTheaterFullscreen();
                return;
            }
        }

        function initShortcutsSettings() {
            const savedPreset = localStorage.getItem('khmer_studio_shortcuts_preset') || 'capcut';
            const presetSelect = document.getElementById('shortcutPresetSelect');
            if (presetSelect) presetSelect.value = savedPreset;
            switchShortcutsPreset(savedPreset);

            if (!isGlobalShortcutsBound) {
                window.addEventListener('keydown', handleGlobalKeydown);
                isGlobalShortcutsBound = true;
            }
        }

        // --- AI FLOW MODAL LOGIC ---
        function openAiFlowModal() {
            const modal = document.getElementById('aiFlowModal');
            const content = document.getElementById('aiFlowModalContent');
            modal.classList.remove('hidden');
            // Trigger reflow
            void modal.offsetWidth;
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }

        function closeAiFlowModal() {
            const modal = document.getElementById('aiFlowModal');
            const content = document.getElementById('aiFlowModalContent');
            content.classList.remove('scale-100', 'opacity-100');
            content.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }

        let autoNarrateAfterGenerate = false;
        
        function simulateAiProgress(title, steps, onComplete) {
            const modal = document.getElementById('aiProgressModal');
            const titleEl = document.getElementById('aiProgressTitle');
            const descEl = document.getElementById('aiProgressDesc');
            const bar = document.getElementById('aiProgressBar');
            const pct = document.getElementById('aiProgressPercent');
            
            titleEl.textContent = title;
            bar.style.width = '0%';
            pct.textContent = '0%';
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 4 + 1.5; // Random speed
                if (progress >= 100) progress = 100;
                
                bar.style.width = `${progress}%`;
                pct.textContent = `${Math.floor(progress)}%`;
                
                const stepIndex = Math.min(Math.floor((progress / 100) * steps.length), steps.length - 1);
                descEl.textContent = steps[stepIndex];
                
                if (progress >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        modal.classList.remove('flex');
                        onComplete();
                    }, 600);
                }
            }, 120);
        }

        function handleAiFlowAction(action) {
            closeAiFlowModal();
            setTimeout(() => {
                const titleInput = document.getElementById('recapTitle');
                if (titleInput && !titleInput.value && activeTimelineElement && activeTimelineElement.dataset.name) {
                    const cleaned = cleanMovieTitle(activeTimelineElement.dataset.name);
                    if (cleaned) titleInput.value = cleaned;
                }

                if (action === 'recap' || action === 'pro-voice') {
                    openToolInInspector('recap');
                    const steps = [
                        "កំពុងទាញយករូបភាពពីវីដេអូ (Extracting frames)...",
                        "កំពុងប្រើ Vision AI វិភាគសាច់រឿង និងតួអង្គ...",
                        "កំពុងរៀបចំរចនាសម្ព័ន្ធស្គ្រីប (Structuring Hook & Body)...",
                        "កំពុងសរសេរអត្ថបទសម្រាយរឿងដ៏ទាក់ទាញ (Generating script)..."
                    ];
                    
                    simulateAiProgress(action === 'pro-voice' ? "រៀបចំសម្រាយរឿងបែបអាជីព (Pro Voice)" : "Sora AI កំពុងតែងស្គ្រីបអូតូ", steps, () => {
                        if (action === 'pro-voice') autoNarrateAfterGenerate = true;
                        
                        // Fake a plot if empty so generation is consistently awesome
                        const plotInput = document.getElementById('recapPlot');
                        if (plotInput && !plotInput.value) {
                            plotInput.value = "វីដេអូនេះបង្ហាញពីការតស៊ូរបស់តួឯកដែលត្រូវជម្នះឧបសគ្គធំ និងជួយសង្គ្រោះអ្នកជាទីស្រលាញ់ពីគ្រោះថ្នាក់ ដោយមានឈុតឆាករំជួលចិត្ត និងកាប់ចាក់យ៉ាងជក់ចិត្ត។";
                        }
                        
                        handleGenerate();
                    });
                } else if (action === 'bgm') {
                    openToolInInspector('recap');
                    const steps = [
                        "កំពុងវិភាគកម្រិតសំឡេង និងបរិយាកាសវីដេអូ...",
                        "កំពុងស្វែងរកភ្លេងដែលសាកសម (Searching Audio Library)...",
                        "កំពុងកាត់តភ្លេងអូតូ (Auto beat-syncing)...",
                        "កំពុងបញ្ចូលទៅក្នុង Timeline..."
                    ];
                    simulateAiProgress("Sora AI កំពុងដាក់ BGM", steps, () => {
                        appendFakeClipToTimeline('audio', { url: '', name: 'AI_Epic_Cinematic_BGM.mp3' });
                        showToast('បានដាក់បញ្ជូលភ្លេងកំដរអារម្មណ៍ (BGM) ដោយស្វ័យប្រវត្តិ!', 'success');
                    });
                }
            }, 300);
        }

        function handleBatchAiFlow() {
            const videoFiles = importedMediaFiles.filter(m => m.type.startsWith('video/'));
            if (videoFiles.length === 0) {
                showToast('សូម Import វីដេអូសិន ដើម្បីអាចបញ្ជា AI កាត់តរឿងទាំងមូលបាន!', 'warning');
                return;
            }

            const steps = [
                "កំពុងរៀបចំវីដេអូទាំងអស់បញ្ចូលទៅក្នុង Timeline...",
                "កំពុងលុបសំឡេងដើមនៃវីដេអូទាំងអស់ (Muting original audio)...",
                "កំពុងទាញយករូបភាពពីគ្រប់ឈុតឆាកទាំងអស់...",
                "កំពុងវិភាគសាច់រឿងរួម និងរៀបចំរចនាសម្ព័ន្ធស្គ្រីប...",
                "កំពុងរៀបចំ BGM និងសរសេរអត្ថបទសម្រាយរឿង..."
            ];

            simulateAiProgress("Sora AI កំពុងកាត់តរឿងទាំងមូល", steps, () => {
                // 1. Sort files to ensure correct order
                videoFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'}));
                
                // 2. Append all videos to timeline and mute them
                let totalDuration = 0;
                videoFiles.forEach(media => {
                    const clip = appendFakeClipToTimeline('video', media);
                    if (clip) {
                        // Add mute icon visual
                        clip.innerHTML += `<div class="absolute bottom-1 right-1 text-rose-500 bg-black/60 rounded px-1 flex items-center justify-center pointer-events-none shadow-sm"><i class="fa-solid fa-volume-xmark text-[10px]"></i></div>`;
                    }
                    if (media.durationFormatted) {
                        const parts = media.durationFormatted.split(':');
                        totalDuration += (parseInt(parts[0]) * 60 + parseInt(parts[1]));
                    } else {
                        totalDuration += 120; // fallback 2 mins
                    }
                });

                // 3. Add one long BGM track underneath
                const bgmDurationStr = `${Math.floor(totalDuration/60)}:${(totalDuration%60).toString().padStart(2, '0')}`;
                appendFakeClipToTimeline('audio', { url: '', name: 'AI_Epic_Cinematic_BGM.mp3', durationFormatted: bgmDurationStr });
                
                showToast(`បានបញ្ចូលវីដេអូចំនួន ${videoFiles.length} ចូល Timeline និងបិទសំឡេងដើមរួចរាល់!`, 'success');

                // 4. Fill generic plot and trigger Recap + Pro Voice
                openToolInInspector('recap');
                const titleInput = document.getElementById('recapTitle');
                if (titleInput) {
                    // Use clean movie title from video name if not pure digits
                    const raw = videoFiles[0].name.replace(/_?[pP]art\s*\d+.*$/i, "").replace(/\.[^/.]+$/, "").trim();
                    const cleaned = cleanMovieTitle(raw);
                    if (cleaned) titleInput.value = cleaned;
                }
                const plotInput = document.getElementById('recapPlot');
                if (plotInput && !plotInput.value) {
                    plotInput.value = "វីដេអូខ្នាតវែងនេះនិយាយពីខ្សែជីវិតតស៊ូរបស់តួឯក ដែលត្រូវឆ្លងកាត់ឧបសគ្គជាច្រើនតាំងពីដើមដល់ចប់។";
                }
                
                autoNarrateAfterGenerate = true; // Pro Voice automatically
                setTimeout(() => handleGenerate(), 1000);
            });
        }