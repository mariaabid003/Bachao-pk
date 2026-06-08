import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator }   from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet }     from 'react-native';
import { C } from '../theme';

import Onboarding     from '../screens/Onboarding';
import Home           from '../screens/Home';
import Heatmap        from '../screens/Heatmap';
import SafeSignals    from '../screens/SafeSignals';
import JourneySetup   from '../screens/JourneySetup';
import RiskResult     from '../screens/RiskResult';
import JourneyActive  from '../screens/JourneyActive';
import SafeArrival    from '../screens/SafeArrival';
import IncidentReport from '../screens/IncidentReport';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function TabIcon({ emoji, label, focused }) {
  return (
    <View style={ti.wrap}>
      <Text style={[ti.emoji, focused && ti.emojiOn]}>{emoji}</Text>
      <Text style={[ti.lbl, focused && ti.lblOn]}>{label}</Text>
    </View>
  );
}

const ti = StyleSheet.create({
  wrap:    { alignItems: 'center', paddingTop: 6, gap: 2 },
  emoji:   { fontSize: 20, opacity: 0.4 },
  emojiOn: { opacity: 1 },
  lbl:     { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.35)', letterSpacing: 0.4 },
  lblOn:   { color: '#FFFFFF' },
});

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.nav,
          borderTopWidth: 0,
          height: 72,
          paddingBottom: 10,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen name="Monitor" component={Home}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" label="MONITOR" focused={focused} /> }} />
      <Tab.Screen name="Heatmap" component={Heatmap}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🔥" label="HEATMAP" focused={focused} /> }} />
      <Tab.Screen name="Signals" component={SafeSignals}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📡" label="SIGNALS" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Onboarding"
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      <Stack.Screen name="Onboarding"     component={Onboarding} />
      <Stack.Screen name="Main"           component={MainTabs} />
      <Stack.Screen name="JourneySetup"   component={JourneySetup} />
      <Stack.Screen name="RiskResult"     component={RiskResult} />
      <Stack.Screen name="JourneyActive"  component={JourneyActive} />
      <Stack.Screen name="SafeArrival"    component={SafeArrival} />
      <Stack.Screen name="IncidentReport" component={IncidentReport} />
    </Stack.Navigator>
  );
}
