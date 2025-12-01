import { useState, useEffect, useRef } from 'react';
import {
    Box, Container, VStack, HStack, Heading, Text, Button, IconButton,
    Input, Select, Slider, SliderTrack, SliderFilledTrack, SliderThumb,
    Card, CardBody, CardHeader, SimpleGrid, Image, Badge,
    FormControl, FormLabel, Progress, Spinner, Icon,
    List, ListItem, Divider, Flex, Spacer, Tag
} from '@chakra-ui/react';
import {
    FolderPlus, Trash2, Play, Pause, Music, Film,
    Image as ImageIcon, User, Layers, Settings, CheckCircle, AlertCircle
} from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import api from './api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const MotionCard = motion(Card);

function App() {
    const [folderPaths, setFolderPaths] = useState([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [images, setImages] = useState([]);
    const [people, setPeople] = useState([]);
    const [themes, setThemes] = useState([]);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [selectedTheme, setSelectedTheme] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [outputPath, setOutputPath] = useState('output.mp4');
    const [resolution, setResolution] = useState('1080p');
    const [generatedVideo, setGeneratedVideo] = useState(null);
    const [audioPath, setAudioPath] = useState('');
    const [audioStart, setAudioStart] = useState(0);
    const [audioEnd, setAudioEnd] = useState(0);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');

    const [imageDuration, setImageDuration] = useState(3.0);
    const [titleText, setTitleText] = useState('');

    // Waveform refs
    const waveformRef = useRef(null);
    const wavesurfer = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const handleBrowse = async () => {
        try {
            const res = await api.browse();
            if (res.path) {
                if (!folderPaths.includes(res.path)) {
                    setFolderPaths([...folderPaths, res.path]);
                }
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to browse folder');
        }
    };

    const removeFolder = (pathToRemove) => {
        setFolderPaths(folderPaths.filter(p => p !== pathToRemove));
    };

    const handleBrowseOutput = async () => {
        try {
            const res = await api.browse();
            if (res.path) {
                setOutputPath(res.path);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleBrowseAudio = async () => {
        try {
            const res = await api.browseFile();
            if (res.path) {
                setAudioPath(res.path);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Initialize Waveform when audioPath changes
    useEffect(() => {
        if (audioPath && waveformRef.current) {
            // Destroy previous instance
            if (wavesurfer.current) {
                wavesurfer.current.destroy();
            }

            // Create new instance
            const ws = WaveSurfer.create({
                container: waveformRef.current,
                waveColor: '#4a90e2',
                progressColor: '#1e3a8a',
                cursorColor: '#ff4b4b',
                height: 80,
                normalize: true,
                plugins: [
                    RegionsPlugin.create()
                ]
            });

            // Load audio
            ws.load(`/api/image?path=${encodeURIComponent(audioPath)}`);

            ws.on('ready', () => {
                const duration = ws.getDuration();
                setAudioEnd(duration); // Default to full duration

                // Add default region
                const wsRegions = ws.registerPlugin(RegionsPlugin.create());
                wsRegions.addRegion({
                    start: 0,
                    end: duration,
                    color: 'rgba(74, 144, 226, 0.2)',
                    drag: true,
                    resize: true
                });

                wsRegions.on('region-updated', (region) => {
                    setAudioStart(region.start);
                    setAudioEnd(region.end);
                });

                wsRegions.on('region-clicked', (region, e) => {
                    e.stopPropagation();
                    region.play();
                });
            });

            ws.on('play', () => setIsPlaying(true));
            ws.on('pause', () => setIsPlaying(false));

            wavesurfer.current = ws;
        }

        return () => {
            if (wavesurfer.current) {
                wavesurfer.current.destroy();
            }
        };
    }, [audioPath]);

    const togglePlayPause = () => {
        if (wavesurfer.current) {
            wavesurfer.current.playPause();
        }
    };

    const handleAnalyze = async () => {
        if (folderPaths.length === 0) return;
        setAnalyzing(true);
        setProgress(0);
        setProgressMessage('Starting analysis...');

        try {
            const res = await api.analyze(folderPaths);

            if (res.status === 'started') {
                // Poll for progress
                const interval = setInterval(async () => {
                    try {
                        const p = await api.getProgress();
                        if (p.status === 'analyzing' || p.status === 'clustering') {
                            setProgress(p.percent);
                            setProgressMessage(p.message);
                        } else if (p.status === 'completed') {
                            clearInterval(interval);
                            setAnalyzing(false);
                            setProgress(100);
                            setProgressMessage('Analysis Complete!');

                            if (p.result) {
                                setImages(p.result.results || []);
                                setPeople(p.result.people || []);
                                setThemes(p.result.themes || []);
                                toast.success(`Found ${p.result.results.length} images.`);
                            }
                        } else if (p.status === 'error') {
                            clearInterval(interval);
                            setAnalyzing(false);
                            toast.error(p.message || 'Analysis failed');
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }, 1000);
            } else {
                // Fallback for immediate return (if not background)
                setAnalyzing(false);
                if (res.results) {
                    setImages(res.results);
                    setPeople(res.people || []);
                    setThemes(res.themes || []);
                    toast.success(`Found ${res.results.length} images.`);
                } else {
                    toast.error('No images found or error occurred.');
                }
            }
        } catch (e) {
            toast.error(e.message);
            setAnalyzing(false);
        }
    };

    const filteredImages = images.filter(img => {
        if (selectedPerson && !selectedPerson.images.includes(img.path)) return false;
        if (selectedTheme && (!img.tags || !img.tags.includes(selectedTheme.name))) return false;
        return true;
    });

    const handleGenerate = async () => {
        if (filteredImages.length === 0) return;
        setGenerating(true);
        setGeneratedVideo(null);
        try {
            const imagePaths = filteredImages.map(img => img.path);
            const res = await api.generate(imagePaths, outputPath, resolution, audioPath, audioStart, audioEnd, imageDuration, titleText);

            if (res.status === 'started') {
                // Poll for progress
                const interval = setInterval(async () => {
                    try {
                        const p = await api.getProgress();
                        if (p.status === 'generating') {
                            setProgress(p.percent);
                            setProgressMessage(p.message);
                        } else if (p.status === 'completed') {
                            clearInterval(interval);
                            setGenerating(false);
                            setProgress(100);
                            setProgressMessage('Complete!');
                            setGeneratedVideo(p.result);
                            toast.success(`Video Generated! Saved to ${p.result}`);
                        } else if (p.status === 'error') {
                            clearInterval(interval);
                            setGenerating(false);
                            toast.error(p.message || 'Video generation failed');
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }, 1000);
            } else if (res.status === 'success') {
                // Fallback for immediate return (shouldn't happen with background tasks)
                setGeneratedVideo(res.output_path);
                toast.success(`Video Generated! Saved to ${res.output_path}`);
                setGenerating(false);
            } else {
                toast.error(res.message || 'Unknown error');
                setGenerating(false);
            }
        } catch (e) {
            toast.error(e.message);
            setGenerating(false);
        }
    };

    return (
        <Container maxW="container.xl" py={8}>
            <VStack spacing={8} align="stretch">
                {/* Header */}
                <Flex align="center" justify="space-between">
                    <HStack spacing={4}>
                        <Box p={2} bg="brand.500" borderRadius="md">
                            <Film color="white" size={32} />
                        </Box>
                        <VStack align="start" spacing={0}>
                            <Heading size="lg">Highlight Generator</Heading>
                            <Text color="gray.500">Turn your photos into cinematic memories</Text>
                        </VStack>
                    </HStack>
                </Flex>

                {/* Main Content Grid */}
                <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8}>

                    {/* Left Column: Controls */}
                    <VStack spacing={6} gridColumn={{ lg: "span 1" }}>

                        {/* Source Selection */}
                        <Card w="100%">
                            <CardHeader>
                                <Heading size="md">1. Select Photos</Heading>
                            </CardHeader>
                            <CardBody>
                                <VStack spacing={4} align="stretch">
                                    <Button leftIcon={<FolderPlus />} onClick={handleBrowse} colorScheme="brand" variant="outline">
                                        Add Folder
                                    </Button>

                                    {/* Manual Path Entry (for Docker/Headless) */}
                                    <HStack>
                                        <Input
                                            placeholder="/path/to/images"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && e.target.value) {
                                                    if (!folderPaths.includes(e.target.value)) {
                                                        setFolderPaths([...folderPaths, e.target.value]);
                                                        e.target.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                        <Button onClick={(e) => {
                                            const input = e.target.previousSibling;
                                            if (input.value && !folderPaths.includes(input.value)) {
                                                setFolderPaths([...folderPaths, input.value]);
                                                input.value = '';
                                            }
                                        }}>Add</Button>
                                    </HStack>

                                    {folderPaths.length > 0 && (
                                        <List spacing={2}>
                                            {folderPaths.map((path, idx) => (
                                                <ListItem key={idx} display="flex" alignItems="center" bg="gray.700" p={2} borderRadius="md">
                                                    <Icon as={CheckCircle} color="green.500" mr={2} />
                                                    <Text fontSize="sm" noOfLines={1} flex={1}>{path}</Text>
                                                    <IconButton
                                                        icon={<Trash2 size={16} />}
                                                        size="xs"
                                                        colorScheme="red"
                                                        variant="ghost"
                                                        onClick={() => removeFolder(path)}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    )}

                                    <Button
                                        colorScheme="brand"
                                        onClick={handleAnalyze}
                                        isLoading={analyzing}
                                        loadingText="Analyzing..."
                                        isDisabled={folderPaths.length === 0}
                                    >
                                        Analyze Images
                                    </Button>

                                    {analyzing && (
                                        <Box w="100%">
                                            <Text fontSize="sm" mb={1}>{progressMessage || `Analyzing: ${Math.round(progress)}%`}</Text>
                                            <Progress value={progress} size="sm" colorScheme="brand" hasStripe isAnimated />
                                        </Box>
                                    )}
                                </VStack>
                            </CardBody>
                        </Card>

                        {/* Audio Settings */}
                        <Card w="100%">
                            <CardHeader>
                                <Heading size="md">2. Audio</Heading>
                            </CardHeader>
                            <CardBody>
                                <VStack spacing={4} align="stretch">
                                    <Button leftIcon={<Music />} onClick={handleBrowseAudio} variant="outline">
                                        Select Music
                                    </Button>
                                    {audioPath && (
                                        <Box>
                                            <Text fontSize="xs" color="gray.400" mb={2} noOfLines={1}>{audioPath}</Text>
                                            <Box ref={waveformRef} id="waveform" borderRadius="md" overflow="hidden" bg="gray.900" mb={2} />
                                            <HStack justify="center">
                                                <IconButton
                                                    icon={isPlaying ? <Pause /> : <Play />}
                                                    onClick={togglePlayPause}
                                                    isRound
                                                    colorScheme="brand"
                                                />
                                            </HStack>
                                        </Box>
                                    )}
                                </VStack>
                            </CardBody>
                        </Card>

                        {/* Video Settings */}
                        <Card w="100%">
                            <CardHeader>
                                <Heading size="md">3. Settings</Heading>
                            </CardHeader>
                            <CardBody>
                                <VStack spacing={4} align="stretch">
                                    <FormControl>
                                        <FormLabel>Resolution</FormLabel>
                                        <Select value={resolution} onChange={(e) => setResolution(e.target.value)}>
                                            <option value="1080p">PC/TV (16:9)</option>
                                            <option value="9:16">Smartphone (9:16)</option>
                                        </Select>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>Image Duration ({imageDuration}s)</FormLabel>
                                        <Slider
                                            value={imageDuration}
                                            min={1}
                                            max={10}
                                            step={0.5}
                                            onChange={(val) => setImageDuration(val)}
                                        >
                                            <SliderTrack>
                                                <SliderFilledTrack />
                                            </SliderTrack>
                                            <SliderThumb />
                                        </Slider>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>Video Title</FormLabel>
                                        <Input
                                            placeholder="My Holiday"
                                            value={titleText}
                                            onChange={(e) => setTitleText(e.target.value)}
                                        />
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>Output Folder</FormLabel>
                                        <HStack>
                                            <Input value={outputPath} isReadOnly size="sm" />
                                            <Button size="sm" onClick={handleBrowseOutput}>Browse</Button>
                                        </HStack>
                                    </FormControl>
                                </VStack>
                            </CardBody>
                        </Card>

                        <Button
                            size="lg"
                            colorScheme="accent"
                            onClick={handleGenerate}
                            isLoading={generating}
                            loadingText="Generating..."
                            isDisabled={filteredImages.length < 10}
                            w="100%"
                        >
                            Generate Video
                        </Button>
                        {generating && (
                            <Box w="100%">
                                <Text fontSize="sm" mb={1}>{progressMessage || `Generating: ${Math.round(progress)}%`}</Text>
                                <Progress value={progress} size="sm" colorScheme="accent" hasStripe isAnimated />
                            </Box>
                        )}
                        {filteredImages.length > 0 && filteredImages.length < 10 && (
                            <Text color="red.400" fontSize="sm" textAlign="center">
                                Need at least 10 images (selected: {filteredImages.length})
                            </Text>
                        )}

                    </VStack>

                    {/* Right Column: Results & Preview */}
                    <VStack spacing={6} gridColumn={{ lg: "span 2" }}>

                        {/* Video Preview */}
                        {generatedVideo && (
                            <MotionCard
                                w="100%"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                border="2px solid"
                                borderColor="brand.500"
                            >
                                <CardHeader>
                                    <Heading size="md">Video Preview</Heading>
                                </CardHeader>
                                <CardBody>
                                    <Box borderRadius="lg" overflow="hidden" bg="black">
                                        <video
                                            controls
                                            src={`/api/image?path=${encodeURIComponent(generatedVideo)}`}
                                            style={{ width: '100%', maxHeight: '500px' }}
                                        />
                                    </Box>
                                </CardBody>
                            </MotionCard>
                        )}

                        {/* Analysis Results */}
                        {images.length > 0 && (
                            <Card w="100%">
                                <CardHeader>
                                    <HStack justify="space-between">
                                        <Heading size="md">Analysis Results</Heading>
                                        <Badge colorScheme="brand">{filteredImages.length} Images</Badge>
                                    </HStack>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={6} align="stretch">

                                        {/* Filters */}
                                        <Box>
                                            <Text fontWeight="bold" mb={2}>People</Text>
                                            <Flex wrap="wrap" gap={2}>
                                                <Tag
                                                    size="lg"
                                                    variant={selectedPerson === null ? 'solid' : 'outline'}
                                                    colorScheme="brand"
                                                    cursor="pointer"
                                                    onClick={() => setSelectedPerson(null)}
                                                >
                                                    All
                                                </Tag>
                                                {people.map(p => (
                                                    <Tag
                                                        key={p.id}
                                                        size="lg"
                                                        variant={selectedPerson === p ? 'solid' : 'outline'}
                                                        colorScheme="brand"
                                                        cursor="pointer"
                                                        onClick={() => setSelectedPerson(selectedPerson === p ? null : p)}
                                                    >
                                                        {p.name} ({p.count})
                                                    </Tag>
                                                ))}
                                            </Flex>
                                        </Box>

                                        <Box>
                                            <Text fontWeight="bold" mb={2}>Themes</Text>
                                            <Flex wrap="wrap" gap={2}>
                                                <Tag
                                                    size="lg"
                                                    variant={selectedTheme === null ? 'solid' : 'outline'}
                                                    colorScheme="purple"
                                                    cursor="pointer"
                                                    onClick={() => setSelectedTheme(null)}
                                                >
                                                    All
                                                </Tag>
                                                {themes.slice(0, 10).map(t => (
                                                    <Tag
                                                        key={t.name}
                                                        size="lg"
                                                        variant={selectedTheme === t ? 'solid' : 'outline'}
                                                        colorScheme="purple"
                                                        cursor="pointer"
                                                        onClick={() => setSelectedTheme(selectedTheme === t ? null : t)}
                                                    >
                                                        {t.name} ({t.count})
                                                    </Tag>
                                                ))}
                                            </Flex>
                                        </Box>

                                        <Divider />

                                        {/* Image Grid */}
                                        <SimpleGrid columns={{ base: 3, md: 5, lg: 6 }} spacing={2}>
                                            {filteredImages.slice(0, 24).map((img, idx) => (
                                                <Box key={idx} position="relative" paddingBottom="100%" overflow="hidden" borderRadius="md">
                                                    <Image
                                                        src={`/api/image?path=${encodeURIComponent(img.path)}`}
                                                        position="absolute"
                                                        top={0}
                                                        left={0}
                                                        w="100%"
                                                        h="100%"
                                                        objectFit="cover"
                                                        transition="transform 0.2s"
                                                        _hover={{ transform: 'scale(1.1)' }}
                                                    />
                                                </Box>
                                            ))}
                                        </SimpleGrid>
                                        {filteredImages.length > 24 && (
                                            <Text textAlign="center" color="gray.500" fontSize="sm">
                                                ...and {filteredImages.length - 24} more
                                            </Text>
                                        )}
                                    </VStack>
                                </CardBody>
                            </Card>
                        )}
                    </VStack>
                </SimpleGrid>
            </VStack>
        </Container>
    );
}

export default App;
