import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Modal, Platform, Pressable, SafeAreaView,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';

const C = {
  cream: '#F1E8D8', paper: '#FFFCF7', ink: '#211F1C', cherry: '#4A1018',
  olive: '#292E1E', muted: '#59633A', sage: '#C8CDB7', caramel: '#D4B38B',
  chocolate: '#4A3027', rose: '#E7D5D0', line: '#DED3C2', white: '#FFFFFF',
};

type Place = {
  id: string; name: string; city: string; category: string; note: string;
  image: string; latitude: number; longitude: number; creator: string;
  type: 'postcard' | 'scrapbook'; visibility: 'Public' | 'Private';
  title?: string; items?: number; saved?: boolean; mine?: boolean;
};
const PHOTOS = {
  coffee: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=900&q=85',
  book: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=900&q=85',
  art: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=900&q=85',
  park: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&q=85',
  food: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&q=85',
  city: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=900&q=85',
  market: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=900&q=85',
  flowers: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=900&q=85',
  gallery: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=900&q=85',
  patio: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=85',
};
const INITIAL: Place[] = [
  { id:'p1', name:'Little Tart Bakeshop', city:'Atlanta, GA', category:'Food & cafés', note:'A flaky pastry, a good coffee, and a corner to people-watch.', image:PHOTOS.coffee, latitude:33.7406, longitude:-84.3452, creator:'Maya R.', type:'postcard', visibility:'Public' },
  { id:'p2', name:'A Cappella Books', city:'Atlanta, GA', category:'Culture', note:'Small, independent, and dangerously easy to lose an hour in.', image:PHOTOS.book, latitude:33.7638, longitude:-84.3491, creator:'Jordan K.', type:'postcard', visibility:'Public' },
  { id:'p3', name:'A Creative Saturday', city:'Atlanta, GA', category:'Art', note:'A little art, a good coffee, and places found by accident.', image:PHOTOS.gallery, latitude:33.7812, longitude:-84.3895, creator:'Samira B.', type:'scrapbook', visibility:'Public', title:'A Creative Saturday in Atlanta', items:4 },
  { id:'p4', name:'BeltLine slow afternoon', city:'Atlanta, GA', category:'Nature', note:'Walk without a plan. Stop when something catches your eye.', image:PHOTOS.park, latitude:33.7652, longitude:-84.3614, creator:'Alex P.', type:'scrapbook', visibility:'Public', title:'Outside for a while', items:3 },
  { id:'p5', name:'Ponce City Market', city:'Atlanta, GA', category:'Food & cafés', note:'Go hungry and split something you have never tried.', image:PHOTOS.market, latitude:33.7726, longitude:-84.3657, creator:'Nina L.', type:'postcard', visibility:'Public' },
  { id:'p6', name:'Westside gallery hop', city:'Atlanta, GA', category:'Art', note:'A low-pressure way to spend a Saturday with friends.', image:PHOTOS.art, latitude:33.7801, longitude:-84.4115, creator:'Chris M.', type:'scrapbook', visibility:'Public', title:'Art without an agenda', items:5 },
  { id:'p7', name:'Dinner on a tiny patio', city:'Atlanta, GA', category:'Food & cafés', note:'The kind of place you almost walk past. Do not.', image:PHOTOS.patio, latitude:33.7592, longitude:-84.3663, creator:'Maya R.', type:'postcard', visibility:'Public' },
  { id:'p8', name:'Flower shop detour', city:'Atlanta, GA', category:'Hidden gems', note:'No occasion needed. Just get yourself a little bunch.', image:PHOTOS.flowers, latitude:33.7544, longitude:-84.3721, creator:'Jamie T.', type:'postcard', visibility:'Public' },
  { id:'p9', name:'Dinner with no plan', city:'Atlanta, GA', category:'Food & cafés', note:'Three friends, one neighborhood, no reservations.', image:PHOTOS.food, latitude:33.7474, longitude:-84.3734, creator:'Noah D.', type:'scrapbook', visibility:'Public', title:'Dinner with no plan', items:3 },
  { id:'p10', name:'City lights after 6', city:'Atlanta, GA', category:'Hidden gems', note:'Take the long way home once in a while.', image:PHOTOS.city, latitude:33.7554, longitude:-84.3900, creator:'Jordan K.', type:'postcard', visibility:'Public' },
  { id:'p11', name:'My quiet corner', city:'Atlanta, GA', category:'Nature', note:'A little place I keep for myself.', image:PHOTOS.park, latitude:33.7680, longitude:-84.3820, creator:'You', type:'postcard', visibility:'Private', mine:true },
];

const CATEGORIES = ['All', 'Food & cafés', 'Art', 'Music', 'Nature', 'Culture', 'Hidden gems'];
const INITIAL_REGION: Region = { latitude:33.765, longitude:-84.377, latitudeDelta:0.075, longitudeDelta:0.075 };

function ActionButton({ label, onPress, secondary=false }: {label:string; onPress:()=>void; secondary?:boolean}) {
  return <Pressable onPress={onPress} style={[styles.actionButton, secondary && styles.secondaryButton]}><Text style={[styles.actionText, secondary && styles.secondaryText]}>{label}</Text></Pressable>;
}
function Chip({ label, active, onPress }: {label:string; active?:boolean; onPress:()=>void}) {
  return <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></Pressable>;
}
function ExperienceCard({ item, onPress, onSave, saved }: {item:Place; onPress:()=>void; onSave:()=>void; saved:boolean}) {
  return (
    <View style={styles.card}>
      <Pressable onPress={onPress}>
        <Image source={{uri:item.image}} style={styles.cardImage} resizeMode="cover" />
        {item.type==='scrapbook' && <View style={styles.collectionTag}><Text style={styles.collectionTagText}>▧  {item.items || 3} PLACES</Text></View>}
      </Pressable>
      <View style={styles.cardCopy}>
        <View style={styles.cardTitleRow}>
          <Pressable style={{flex:1}} onPress={onPress}><Text style={styles.cardTitle}>{item.title || item.name}</Text></Pressable>
          <Pressable onPress={onSave} hitSlop={10}><Text style={[styles.bookmark, saved && {color:C.cherry}]}>{saved ? '♥' : '♡'}</Text></Pressable>
        </View>
        <Text style={styles.cardMeta}>{item.name}{item.type==='scrapbook' ? ` · ${item.city}` : ''}</Text>
        <Text style={styles.cardCreator}>A note from {item.creator}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<'Explore'|'Discover'|'Saved'>('Explore');
  const [mode, setMode] = useState<'gallery'|'map'>('gallery');
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>(INITIAL);
  const [savedIds, setSavedIds] = useState<string[]>(['p2','p4']);
  const [selected, setSelected] = useState<Place|null>(null);
  const [createType, setCreateType] = useState<'postcard'|'scrapbook'|null>(null);
  const [photo, setPhoto] = useState<string|null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCity, setNewCity] = useState('Atlanta, GA');
  const [newNote, setNewNote] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [visibility, setVisibility] = useState<'Public'|'Private'>('Public');
  const [expiry, setExpiry] = useState('Never');
  const [recommendPrompt, setRecommendPrompt] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [mapRegion, setMapRegion] = useState(INITIAL_REGION);
  const [mapSelected, setMapSelected] = useState<Place|null>(INITIAL[0]);
  const [detailMap, setDetailMap] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const visible = useMemo(() => places.filter(p =>
    (p.visibility==='Public' || p.mine) &&
    (category==='All' || p.category===category) &&
    (`${p.name} ${p.city} ${p.category} ${p.title||''}`).toLowerCase().includes(query.toLowerCase()) &&
    (tab!=='Saved' || savedIds.includes(p.id))
  ), [places, category, query, tab, savedIds]);
  const columns = width > 700 ? 3 : 2;
  const cardWidth = (width - 48 - (columns-1)*12) / columns;

  function toggleSave(id:string) {
    setSavedIds(old => old.includes(id) ? old.filter(x=>x!==id) : [...old,id]);
  }
  function resetCreate() {
    setCreateType(null); setPhoto(null); setNewTitle(''); setNewNote('');
    setNewDescription(''); setVisibility('Public'); setExpiry('Never');
  }
  async function choosePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Photo access needed', 'Allow photo library access to add a picture.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes:['images'], allowsEditing:true, quality:0.8, aspect:[4,3] });
    if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
  }
  function publish() {
    if (!newTitle.trim()) { Alert.alert('Add a title', createType==='postcard' ? 'Add the place name first.' : 'Give your scrapbook a title.'); return; }
    if (!newCity.trim()) { Alert.alert('Add a city', 'Enter the city for this experience.'); return; }
    const item: Place = {
      id:`local-${Date.now()}`, name:newTitle.trim(), title:createType==='scrapbook'?newTitle.trim():undefined,
      city:newCity.trim(), category:category==='All'?'Hidden gems':category,
      note:(createType==='scrapbook'?newDescription:newNote).trim() || 'A new experience to remember.',
      image:photo || PHOTOS.city, latitude:33.765, longitude:-84.377, creator:'You',
      type:createType || 'postcard', visibility, mine:true, items:createType==='scrapbook'?1:undefined,
    };
    setPlaces(old=>[item,...old]); if (visibility==='Private') setSavedIds(old=>[...old,item.id]);
    resetCreate(); setTab('Explore'); setMode('gallery'); setSelected(item);
    Alert.alert('Saved!', visibility==='Private' ? 'Your private creation is saved to your profile.' : 'Your creation is now in the local discovery feed.');
  }
  const openCreate = (type:'postcard'|'scrapbook') => { setCreateType(type); setNewTitle(''); setNewNote(''); setNewDescription(''); setPhoto(null); setVisibility('Public'); };
  const goMap = () => { setTab('Explore'); setMode('map'); setMapSelected(visible[0] || places[0]); };
  const showMapFor = (item:Place) => { setMapSelected(item); setMapRegion({latitude:item.latitude,longitude:item.longitude,latitudeDelta:0.025,longitudeDelta:0.025}); setDetailMap(true); };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.cream}/>
      <View style={styles.topBar}>
        <Pressable onPress={()=>{setTab('Explore');setMode('gallery');}}><Text style={styles.logo}>noted<Text style={styles.logoBang}>!</Text></Text></Pressable>
        <Text style={styles.topTag}>REAL PLACES, REAL PEOPLE</Text>
        <Pressable style={styles.avatar} onPress={()=>setProfileOpen(true)}><Text style={styles.avatarText}>M</Text></Pressable>
      </View>

      {mode==='map' && tab!=='Saved' ? (
        <View style={styles.flex}>
          <View style={styles.mapHeading}>
            <View style={{flex:1}}><Text style={styles.eyebrow}>YOUR CITY, THROUGH PEOPLE</Text><Text style={styles.heading}>Find it on the map.</Text></View>
            <View style={styles.toggle}><Pressable onPress={()=>setMode('map')} style={[styles.toggleItem,styles.toggleOn]}><Text style={styles.toggleOnText}>Map</Text></Pressable><Pressable onPress={()=>setMode('gallery')} style={styles.toggleItem}><Text style={styles.toggleText}>Gallery</Text></Pressable></View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>{CATEGORIES.map(c=><Chip key={c} label={c} active={category===c} onPress={()=>setCategory(c)}/>)}</ScrollView>
          {Platform.OS==='web' ? (
            <View style={styles.webMapFallback}>
              <Text style={styles.fallbackTitle}>Your Atlanta map</Text>
              <Text style={styles.fallbackCopy}>Open this prototype on iOS or Android to use the interactive map. You can still browse the places below.</Text>
              <View style={styles.mapFallbackGrid}>{visible.slice(0,4).map(p=><Pressable key={p.id} style={styles.fallbackPlace} onPress={()=>setMapSelected(p)}><Image source={{uri:p.image}} style={styles.fallbackImage}/><Text style={styles.cardTitle}>{p.name}</Text></Pressable>)}</View>
            </View>
          ) : (
            <View style={styles.mapContainer}>
              <MapView style={StyleSheet.absoluteFillObject} initialRegion={INITIAL_REGION} region={mapRegion} onRegionChangeComplete={setMapRegion} showsUserLocation={false}>
                {visible.filter(p=>p.visibility==='Public').map(p=><Marker key={p.id} coordinate={{latitude:p.latitude,longitude:p.longitude}} onPress={()=>setMapSelected(p)} tracksViewChanges={false}>
                  <View style={[styles.mapPin,mapSelected?.id===p.id&&styles.mapPinSelected]}><Text style={styles.pinEmoji}>{p.category==='Food & cafés'?'☕':p.category==='Art'?'✳':p.category==='Nature'?'🌿':'✦'}</Text></View>
                </Marker>)}
              </MapView>
              <Pressable style={styles.recenter} onPress={()=>setMapRegion(INITIAL_REGION)}><Text style={styles.recenterText}>◎</Text></Pressable>
            </View>
          )}
          {mapSelected && <Pressable style={styles.mapPreview} onPress={()=>setSelected(mapSelected)}>
            <Image source={{uri:mapSelected.image}} style={styles.mapPreviewImage}/>
            <View style={styles.mapPreviewCopy}><Text style={styles.eyebrow}>{mapSelected.category.toUpperCase()} · ATLANTA</Text><Text style={styles.cardTitle}>{mapSelected.title||mapSelected.name}</Text><Text numberOfLines={2} style={styles.cardMeta}>{mapSelected.note}</Text><Text style={styles.openLink}>OPEN STORY ↗</Text></View>
            <Pressable onPress={()=>showMapFor(mapSelected)} style={styles.smallCircle}><Text>↗</Text></Pressable>
          </Pressable>}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
          {tab==='Explore' && <>
            <Text style={styles.eyebrow}>ATLANTA, GEORGIA · THIS WEEKEND</Text>
            <Text style={styles.heroTitle}>Get out there.</Text>
            <Text style={styles.heroCopy}>Find places worth experiencing, through people worth listening to.</Text>
            <View style={styles.searchBox}><Text style={styles.searchIcon}>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder="Try “bookstore” or “Inman Park”" placeholderTextColor="#81786E" style={styles.searchInput}/><Pressable onPress={()=>setQuery('')}><Text style={styles.clearSearch}>×</Text></Pressable></View>
            <View style={styles.primaryRow}><ActionButton label="Explore the map  ↗" onPress={goMap}/><Pressable style={styles.outlineButton} onPress={()=>setShowRecommendations(v=>!v)}><Text style={styles.outlineText}>✦ For me</Text></Pressable></View>
            {showRecommendations && <View style={styles.recommendBox}><Text style={styles.sectionTitle}>What are you in the mood for?</Text><TextInput value={recommendPrompt} onChangeText={setRecommendPrompt} placeholder="e.g. low-cost art and coffee" style={styles.formInput}/><ActionButton label="Find my kind of place" onPress={()=>{setQuery(recommendPrompt);setShowRecommendations(false);setTab('Discover');}}/><Text style={styles.smallNote}>Prototype recommendations use sample community content.</Text></View>}
            <View style={styles.sectionHeader}><View><Text style={styles.eyebrow}>A GOOD PLACE TO START</Text><Text style={styles.sectionTitle}>Through people around you</Text></View><Pressable onPress={goMap}><Text style={styles.textLink}>Map ↗</Text></Pressable></View>
          </>}
          {tab==='Discover' && <>
            <Text style={styles.eyebrow}>THE COMMUNITY BOARD</Text><Text style={styles.heroTitle}>Worth passing on.</Text><Text style={styles.heroCopy}>Little recommendations from people who have actually been there.</Text>
            <View style={styles.searchBox}><Text style={styles.searchIcon}>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder="Search places, people, moods..." placeholderTextColor="#81786E" style={styles.searchInput}/></View>
          </>}
          {tab==='Saved' && <>
            <Text style={styles.eyebrow}>YOUR LITTLE COLLECTION</Text><Text style={styles.heroTitle}>Keep this close.</Text><Text style={styles.heroCopy}>Places and adventures you want to come back to.</Text>
          </>}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>{CATEGORIES.map(c=><Chip key={c} label={c} active={category===c} onPress={()=>setCategory(c)}/>)}</ScrollView>
          <View style={styles.feedGrid}>{visible.map((p,i)=><View key={p.id} style={{width:cardWidth}}><ExperienceCard item={p} onPress={()=>setSelected(p)} onSave={()=>toggleSave(p.id)} saved={savedIds.includes(p.id)}/></View>)}</View>
          {visible.length===0 && <View style={styles.empty}><Text style={styles.emptyTitle}>Nothing pinned here yet.</Text><Text style={styles.cardMeta}>Try another category or search.</Text><ActionButton label="Clear filters" onPress={()=>{setCategory('All');setQuery('');}} secondary/></View>}
        </ScrollView>
      )}

      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem} onPress={()=>{setTab('Explore');setMode('gallery');}}><Text style={[styles.navIcon,tab==='Explore'&&styles.navActive]}>⌂</Text><Text style={[styles.navLabel,tab==='Explore'&&styles.navActive]}>Explore</Text></Pressable>
        <Pressable style={styles.navItem} onPress={()=>{setTab('Discover');setMode('gallery');}}><Text style={[styles.navIcon,tab==='Discover'&&styles.navActive]}>▦</Text><Text style={[styles.navLabel,tab==='Discover'&&styles.navActive]}>Discover</Text></Pressable>
        <Pressable style={styles.createNav} onPress={()=>Alert.alert('Make something', 'What would you like to create?', [{text:'Cancel',style:'cancel'},{text:'Postcard',onPress:()=>openCreate('postcard')},{text:'Scrapbook',onPress:()=>openCreate('scrapbook')}])}><Text style={styles.plus}>＋</Text></Pressable>
        <Pressable style={styles.navItem} onPress={()=>{setTab('Saved');setMode('gallery');}}><Text style={[styles.navIcon,tab==='Saved'&&styles.navActive]}>♡</Text><Text style={[styles.navLabel,tab==='Saved'&&styles.navActive]}>Saved</Text></Pressable>
      </View>

      <Modal visible={!!selected} animationType="slide" onRequestClose={()=>setSelected(null)}>
        <SafeAreaView style={styles.modalSafe}>
          {selected && <ScrollView>
            <View style={styles.detailTop}><Pressable onPress={()=>setSelected(null)} style={styles.backButton}><Text style={styles.backText}>←</Text></Pressable><Text style={styles.eyebrow}>{selected.type==='scrapbook'?'A COMMUNITY SCRAPBOOK':'A POSTCARD FROM SOMEONE'}</Text><Pressable onPress={()=>toggleSave(selected.id)}><Text style={styles.bookmark}>{savedIds.includes(selected.id)?'♥':'♡'}</Text></Pressable></View>
            <Image source={{uri:selected.image}} style={styles.detailImage}/>
            <View style={styles.detailBody}><Text style={styles.eyebrow}>{selected.city.toUpperCase()} · {selected.category.toUpperCase()}</Text><Text style={styles.detailTitle}>{selected.title||selected.name}</Text><Text style={styles.detailNote}>“{selected.note}”</Text><Text style={styles.detailCreator}>A note from {selected.creator}</Text>
              {selected.type==='scrapbook' && <View style={styles.scrapbookStrip}><Text style={styles.sectionTitle}>{selected.items||3} little stops</Text><Text style={styles.cardMeta}>A collection of places worth making time for.</Text>{places.filter(p=>p.id!==selected.id&&p.visibility==='Public').slice(0,3).map(p=><Pressable key={p.id} style={styles.stopRow} onPress={()=>setSelected(p)}><Image source={{uri:p.image}} style={styles.stopImage}/><View style={{flex:1}}><Text style={styles.cardTitle}>{p.name}</Text><Text style={styles.cardMeta}>{p.category}</Text></View><Text>↗</Text></Pressable>)}</View>}
              <ActionButton label="See it on the map ↗" onPress={()=>{showMapFor(selected);setSelected(null);setMode('map');}}/>
              <View style={{height:36}}/>
            </View>
          </ScrollView>}
        </SafeAreaView>
      </Modal>

      <Modal visible={!!createType} animationType="slide" onRequestClose={resetCreate}>
        <SafeAreaView style={styles.modalSafe}>
          <ScrollView contentContainerStyle={styles.createPage}>
            <View style={styles.detailTop}><Pressable onPress={resetCreate} style={styles.backButton}><Text style={styles.backText}>←</Text></Pressable><Text style={styles.eyebrow}>MAKE SOMETHING PERSONAL</Text><View style={{width:34}}/></View>
            <Text style={styles.detailTitle}>{createType==='postcard'?'A little note from here.':'Put the day together.'}</Text>
            <Text style={styles.heroCopy}>{createType==='postcard'?'One place, one photo, one reason to go.':'A collection of places that make sense together.'}</Text>
            <Pressable onPress={choosePhoto} style={styles.photoPicker}>{photo?<Image source={{uri:photo}} style={styles.pickedPhoto}/>:<><Text style={styles.photoPlus}>＋</Text><Text style={styles.sectionTitle}>Add a photo</Text><Text style={styles.cardMeta}>Make it yours</Text></>}</Pressable>
            <Text style={styles.formLabel}>{createType==='postcard'?'PLACE NAME':'SCRAPBOOK TITLE'}</Text><TextInput value={newTitle} onChangeText={setNewTitle} placeholder={createType==='postcard'?'e.g. Little Tart Bakeshop':'e.g. A creative Saturday'} style={styles.formInput}/>
            <Text style={styles.formLabel}>CITY</Text><TextInput value={newCity} onChangeText={setNewCity} placeholder="City, State" style={styles.formInput}/>
            <Text style={styles.formLabel}>{createType==='postcard'?'YOUR NOTE':'DESCRIPTION'}</Text><TextInput value={createType==='postcard'?newNote:newDescription} onChangeText={createType==='postcard'?setNewNote:setNewDescription} placeholder={createType==='postcard'?'Why would you recommend it?':'What ties these places together?'} style={[styles.formInput,styles.multiline]} multiline/>
            <Text style={styles.formLabel}>WHO CAN SEE IT?</Text><View style={styles.optionRow}><Chip label="Public" active={visibility==='Public'} onPress={()=>setVisibility('Public')}/><Chip label="Private" active={visibility==='Private'} onPress={()=>setVisibility('Private')}/></View>
            {createType==='postcard' && <><Text style={styles.formLabel}>EXPIRES</Text><View style={styles.optionRow}>{['Never','24 hours','7 days'].map(v=><Chip key={v} label={v} active={expiry===v} onPress={()=>setExpiry(v)}/>)}</View></>}
            <ActionButton label={visibility==='Private'?'Save privately':'Publish'} onPress={publish}/>
            <Text style={styles.smallNote}>Frontend demo only: this content is stored in local app state, not shared with other users yet.</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={profileOpen} transparent animationType="fade" onRequestClose={()=>setProfileOpen(false)}>
        <Pressable style={styles.profileOverlay} onPress={()=>setProfileOpen(false)}><Pressable style={styles.profileCard} onPress={()=>{}}>
          <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>M</Text></View><Text style={styles.detailTitle}>Your corner.</Text><Text style={styles.cardMeta}>Your postcards, scrapbooks, and saved places.</Text>
          <ActionButton label={`My creations (${places.filter(p=>p.mine).length})`} onPress={()=>{setProfileOpen(false);setTab('Discover');setCategory('All');setQuery('');}} secondary/>
          <ActionButton label="Close" onPress={()=>setProfileOpen(false)}/>
        </Pressable></Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.cream}, flex:{flex:1}, modalSafe:{flex:1,backgroundColor:C.cream},
  topBar:{height:58,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:C.line},
  logo:{fontSize:27,fontWeight:'800',color:C.cherry,letterSpacing:-1}, logoBang:{color:C.muted}, topTag:{fontSize:8,fontWeight:'800',letterSpacing:1.3,color:C.muted},
  avatar:{width:34,height:34,borderRadius:17,backgroundColor:C.muted,alignItems:'center',justifyContent:'center'},avatarText:{color:C.paper,fontWeight:'800'},
  page:{paddingHorizontal:18,paddingTop:23,paddingBottom:28}, eyebrow:{fontSize:9,fontWeight:'800',letterSpacing:1.5,color:C.muted,marginBottom:7},
  heroTitle:{fontSize:42,lineHeight:47,fontWeight:'800',color:C.ink,letterSpacing:-1.7}, heroCopy:{fontSize:15,lineHeight:22,color:C.chocolate,marginTop:7,marginBottom:18,maxWidth:500},
  searchBox:{height:49,borderWidth:1,borderColor:C.ink,borderRadius:8,backgroundColor:C.paper,flexDirection:'row',alignItems:'center',paddingHorizontal:12,marginBottom:11},
  searchIcon:{fontSize:24,color:C.chocolate,marginRight:8},searchInput:{flex:1,fontSize:13,color:C.ink,paddingVertical:7},clearSearch:{fontSize:20,color:C.muted,paddingHorizontal:4},
  primaryRow:{flexDirection:'row',gap:9,marginBottom:24},actionButton:{backgroundColor:C.cherry,borderRadius:7,paddingHorizontal:17,paddingVertical:14,alignItems:'center',justifyContent:'center',minHeight:45,flex:1},
  actionText:{color:C.paper,fontSize:13,fontWeight:'800'},secondaryButton:{backgroundColor:C.paper,borderWidth:1,borderColor:C.cherry},secondaryText:{color:C.cherry},
  outlineButton:{borderWidth:1,borderColor:C.ink,borderRadius:7,paddingHorizontal:15,alignItems:'center',justifyContent:'center',backgroundColor:C.paper},outlineText:{fontWeight:'700',color:C.ink,fontSize:12},
  sectionHeader:{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',marginBottom:12},sectionTitle:{fontSize:21,fontWeight:'800',color:C.ink,letterSpacing:-.5},textLink:{color:C.cherry,fontWeight:'800',fontSize:12},
  chipsRow:{gap:7,paddingBottom:16,paddingTop:3},chip:{paddingHorizontal:14,paddingVertical:9,borderRadius:22,borderWidth:1,borderColor:C.ink,backgroundColor:'transparent'},chipActive:{backgroundColor:C.cherry,borderColor:C.cherry},chipText:{fontSize:11,color:C.ink,fontWeight:'600'},chipTextActive:{color:C.paper},
  feedGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:15},card:{backgroundColor:C.paper,borderRadius:9,overflow:'hidden',borderWidth:1,borderColor:'#E8DFD2'},cardImage:{width:'100%',height:190,backgroundColor:C.sage},cardCopy:{paddingHorizontal:10,paddingVertical:9},cardTitleRow:{flexDirection:'row',alignItems:'flex-start',gap:6},cardTitle:{fontSize:14,fontWeight:'800',color:C.ink,lineHeight:18},bookmark:{fontSize:22,color:C.chocolate,lineHeight:24},cardMeta:{fontSize:11,color:C.chocolate,marginTop:4,lineHeight:16},cardCreator:{fontSize:10,color:C.muted,marginTop:6},collectionTag:{position:'absolute',left:8,top:8,backgroundColor:C.paper,paddingHorizontal:8,paddingVertical:5,borderRadius:4},collectionTagText:{fontSize:8,fontWeight:'900',color:C.cherry,letterSpacing:.7},
  bottomNav:{height:66,backgroundColor:C.paper,borderTopWidth:1,borderTopColor:C.line,flexDirection:'row',alignItems:'center',justifyContent:'space-around',paddingHorizontal:12},navItem:{alignItems:'center',justifyContent:'center',minWidth:55,gap:2},navIcon:{fontSize:23,color:C.chocolate},navLabel:{fontSize:9,color:C.chocolate,fontWeight:'600'},navActive:{color:C.cherry,fontWeight:'900'},createNav:{width:43,height:43,borderRadius:22,backgroundColor:C.cherry,alignItems:'center',justifyContent:'center',marginTop:-18,borderWidth:4,borderColor:C.cream},plus:{fontSize:28,color:C.paper,lineHeight:32},
  mapHeading:{paddingHorizontal:18,paddingTop:15,paddingBottom:10,flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between'},heading:{fontSize:27,fontWeight:'800',color:C.ink,letterSpacing:-.8},toggle:{flexDirection:'row',borderWidth:1,borderColor:C.ink,borderRadius:7,overflow:'hidden'},toggleItem:{paddingHorizontal:12,paddingVertical:8},toggleOn:{backgroundColor:C.ink},toggleText:{fontSize:11,color:C.ink,fontWeight:'700'},toggleOnText:{fontSize:11,color:C.paper,fontWeight:'700'},mapContainer:{flex:1,marginHorizontal:12,borderRadius:12,overflow:'hidden',borderWidth:1,borderColor:C.line,minHeight:230},mapPin:{width:38,height:38,borderRadius:19,backgroundColor:C.paper,borderWidth:2,borderColor:C.cherry,alignItems:'center',justifyContent:'center',elevation:3},mapPinSelected:{backgroundColor:C.cherry,transform:[{scale:1.15}]},pinEmoji:{fontSize:16},recenter:{position:'absolute',right:12,top:12,width:38,height:38,borderRadius:19,backgroundColor:C.paper,alignItems:'center',justifyContent:'center',elevation:3},recenterText:{fontSize:23,color:C.cherry},mapPreview:{marginHorizontal:12,marginTop:10,marginBottom:10,backgroundColor:C.paper,borderRadius:10,padding:9,flexDirection:'row',gap:10,alignItems:'center',borderWidth:1,borderColor:C.line},mapPreviewImage:{width:88,height:91,borderRadius:7},mapPreviewCopy:{flex:1},openLink:{fontSize:9,fontWeight:'900',letterSpacing:1,color:C.cherry,marginTop:7},smallCircle:{width:30,height:30,borderRadius:15,backgroundColor:C.sage,alignItems:'center',justifyContent:'center'},webMapFallback:{flex:1,margin:12,padding:20,backgroundColor:C.sage,borderRadius:12},fallbackTitle:{fontSize:25,fontWeight:'800',color:C.ink},fallbackCopy:{fontSize:13,lineHeight:20,color:C.chocolate,marginTop:8},mapFallbackGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:16},fallbackPlace:{width:'47%',backgroundColor:C.paper,padding:8,borderRadius:8},fallbackImage:{width:'100%',height:95,borderRadius:5,marginBottom:5},
  recommendBox:{backgroundColor:C.sage,padding:14,borderRadius:9,marginBottom:18,gap:9},smallNote:{fontSize:10,lineHeight:15,color:C.muted,marginTop:9},empty:{padding:25,alignItems:'center',gap:12},emptyTitle:{fontSize:20,fontWeight:'800',color:C.ink},
  detailTop:{paddingHorizontal:18,paddingVertical:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},backButton:{width:34,height:34,borderRadius:17,backgroundColor:C.sage,alignItems:'center',justifyContent:'center'},backText:{fontSize:22,color:C.cherry},detailImage:{width:'100%',height:320,backgroundColor:C.sage},detailBody:{padding:22},detailTitle:{fontSize:34,lineHeight:39,fontWeight:'800',color:C.cherry,letterSpacing:-1},detailNote:{fontSize:20,lineHeight:29,color:C.ink,fontStyle:'italic',marginTop:17},detailCreator:{fontSize:12,color:C.muted,marginTop:14,marginBottom:20},scrapbookStrip:{marginVertical:16,padding:14,backgroundColor:C.paper,borderRadius:9},stopRow:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:9,borderBottomWidth:1,borderBottomColor:C.line},stopImage:{width:53,height:53,borderRadius:6},createPage:{padding:18,paddingBottom:38},photoPicker:{height:180,borderRadius:10,borderWidth:1,borderColor:C.line,borderStyle:'dashed',backgroundColor:C.paper,alignItems:'center',justifyContent:'center',marginBottom:20,overflow:'hidden'},photoPlus:{fontSize:36,color:C.cherry},pickedPhoto:{width:'100%',height:'100%'},formLabel:{fontSize:9,fontWeight:'900',letterSpacing:1.2,color:C.muted,marginTop:14,marginBottom:7},formInput:{backgroundColor:C.paper,borderWidth:1,borderColor:C.line,borderRadius:7,paddingHorizontal:12,paddingVertical:12,fontSize:13,color:C.ink},multiline:{height:90,textAlignVertical:'top'},optionRow:{flexDirection:'row',gap:8,flexWrap:'wrap',marginBottom:8},profileOverlay:{flex:1,backgroundColor:'rgba(25,20,17,0.45)',justifyContent:'center',padding:24},profileCard:{backgroundColor:C.cream,borderRadius:15,padding:22,gap:12},profileAvatar:{width:56,height:56,borderRadius:28,backgroundColor:C.muted,alignItems:'center',justifyContent:'center'},profileAvatarText:{fontSize:23,color:C.paper,fontWeight:'800'},
});
