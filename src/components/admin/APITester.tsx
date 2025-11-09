import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, User, Users, Package, TruckIcon, ClipboardCheck, FileText } from 'lucide-react';
import { authApi, usersApi, assetsApi, movementsApi, auditsApi, filesApi, checkBackendHealth } from '@/lib/api-client';

export default function APITester() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Data states
  const [users, setUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [assetStats, setAssetStats] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [movementStats, setMovementStats] = useState<any>(null);
  const [audits, setAudits] = useState<any[]>([]);
  const [auditStats, setAuditStats] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [fileStats, setFileStats] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Login form
  const [email, setEmail] = useState('admin@factory.com');
  const [password, setPassword] = useState('password123');

  // Check backend health on mount
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setBackendStatus('checking');
    const isOnline = await checkBackendHealth();
    setBackendStatus(isOnline ? 'online' : 'offline');
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const user = await authApi.login(email, password);
      setCurrentUser(user);
      setIsLoggedIn(true);
      setSuccess(`Logged in as ${user.name}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await authApi.logout();
      setIsLoggedIn(false);
      setCurrentUser(null);
      setUsers([]);
      setUserStats(null);
      setAssets([]);
      setAssetStats(null);
      setMovements([]);
      setMovementStats(null);
      setAudits([]);
      setAuditStats(null);
      setFiles([]);
      setFileStats(null);
      setSuccess('Logged out successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await usersApi.getAll({ limit: 10 });
      setUsers(result.users);
      setSuccess(`Loaded ${result.users.length} users`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await usersApi.getStats();
      setUserStats(data);
      setSuccess('Loaded user statistics');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await assetsApi.getAll({ limit: 10 });
      setAssets(result.assets);
      setSuccess(`Loaded ${result.assets.length} assets`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAssetStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await assetsApi.getStats();
      setAssetStats(data);
      setSuccess('Loaded asset statistics');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await movementsApi.getAll({ limit: 10 });
      setMovements(result.movements);
      setSuccess(`Loaded ${result.movements.length} movements`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMovementStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await movementsApi.getStats();
      setMovementStats(data);
      setSuccess('Loaded movement statistics');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAudits = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await auditsApi.getAll({ limit: 10 });
      setAudits(result.audits);
      setSuccess(`Loaded ${result.audits.length} audits`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await auditsApi.getStats();
      setAuditStats(data);
      setSuccess('Loaded audit statistics');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFileStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await filesApi.getStats();
      setFileStats(data);
      setSuccess('Loaded file statistics');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Backend API Tester</CardTitle>
          <CardDescription>
            Test connection to Node.js + Express backend API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Backend Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                backendStatus === 'online' ? 'bg-green-500' : 
                backendStatus === 'offline' ? 'bg-red-500' : 
                'bg-yellow-500 animate-pulse'
              }`} />
              <div>
                <div className="font-semibold">Backend Server</div>
                <div className="text-sm text-muted-foreground">
                  http://localhost:5000
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${
                backendStatus === 'online' ? 'text-green-600' : 
                backendStatus === 'offline' ? 'text-red-600' : 
                'text-yellow-600'
              }`}>
                {backendStatus === 'online' ? 'Online' : 
                 backendStatus === 'offline' ? 'Offline' : 
                 'Checking...'}
              </span>
              <Button size="sm" variant="outline" onClick={checkHealth}>
                Refresh
              </Button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Login Section */}
          {!isLoggedIn ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Login</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@factory.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password123"
                  />
                </div>
                <Button 
                  onClick={handleLogin} 
                  disabled={loading || backendStatus !== 'online'}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
                <div className="text-sm text-muted-foreground">
                  <div>Test accounts:</div>
                  <div>• admin@factory.com / password123</div>
                  <div>• shop@factory.com / password123</div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Current User */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Current User
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentUser && (
                    <div className="space-y-2">
                      <div><strong>Name:</strong> {currentUser.name}</div>
                      <div><strong>Email:</strong> {currentUser.email}</div>
                      <div><strong>Role:</strong> {currentUser.role}</div>
                      <div><strong>Department:</strong> {currentUser.department}</div>
                    </div>
                  )}
                  <Button 
                    onClick={handleLogout} 
                    variant="destructive"
                    className="w-full"
                  >
                    Logout
                  </Button>
                </CardContent>
              </Card>

              {/* API Tabs */}
              <Tabs defaultValue="users" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="users">
                    <Users className="h-4 w-4 mr-1" />
                    Users
                  </TabsTrigger>
                  <TabsTrigger value="assets">
                    <Package className="h-4 w-4 mr-1" />
                    Assets
                  </TabsTrigger>
                  <TabsTrigger value="movements">
                    <TruckIcon className="h-4 w-4 mr-1" />
                    Movements
                  </TabsTrigger>
                  <TabsTrigger value="audits">
                    <ClipboardCheck className="h-4 w-4 mr-1" />
                    Audits
                  </TabsTrigger>
                  <TabsTrigger value="files">
                    <FileText className="h-4 w-4 mr-1" />
                    Files
                  </TabsTrigger>
                </TabsList>

                {/* Users Tab */}
                <TabsContent value="users" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">User API</CardTitle>
                      <CardDescription>8 endpoints - User management</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button onClick={loadUsers} disabled={loading} className="w-full" variant="outline">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        GET /api/users
                      </Button>
                      <Button onClick={loadUserStats} disabled={loading} className="w-full" variant="outline">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        GET /api/users/stats
                      </Button>
                    </CardContent>
                  </Card>

                  {users.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Users ({users.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {users.map((user) => (
                            <div key={user.id} className="p-3 border rounded-lg">
                              <div className="font-semibold">{user.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {user.email} • <Badge variant="secondary">{user.role}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {userStats && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium">Total</div>
                            <div className="text-2xl font-bold">{userStats.total}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Recent</div>
                            <div className="text-2xl font-bold">{userStats.recent}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Assets Tab */}
                <TabsContent value="assets" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Assets API</CardTitle>
                      <CardDescription>10 endpoints - Asset management + QR codes</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button onClick={loadAssets} disabled={loading} className="w-full" variant="outline">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        GET /api/assets
                      </Button>
                      <Button onClick={loadAssetStats} disabled={loading} className="w-full" variant="outline">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        GET /api/assets/stats
                      </Button>
                    </CardContent>
                  </Card>

                  {assets.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Assets ({assets.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {assets.map((asset) => (
                            <div key={asset.id} className="p-3 border rounded-lg">
                              <div className="font-semibold">{asset.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {asset.assetUid} • <Badge variant="secondary">{asset.category}</Badge> • <Badge>{asset.status}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {assetStats && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium">Total Assets</div>
                            <div className="text-2xl font-bold">{assetStats.total}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Active</div>
                            <div className="text-2xl font-bold text-green-600">
                              {assetStats.byStatus?.find((s: any) => s.status === 'ACTIVE')?.count || 0}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Movements Tab */}
                <TabsContent value="movements" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Movements API</CardTitle>
                      <CardDescription>10 endpoints - Movement workflow + SLA monitoring</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button onClick={loadMovements} disabled={loading} className="w-full" variant="outline">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        GET /api/movements
                      </Button>
                      <Button onClick={loadMovementStats} disabled={loading} className="w-full" variant="outline">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        GET /api/movements/stats
                      </Button>
                    </CardContent>
                  </Card>

                  {movements.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Movements ({movements.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {movements.map((movement) => (
                            <div key={movement.id} className="p-3 border rounded-lg">
                              <div className="font-semibold">{movement.fromLocation} → {movement.toLocation}</div>
                              <div className="text-sm text-muted-foreground">
                                <Badge variant="secondary">{movement.status}</Badge> • SLA: <Badge>{movement.slaStatus}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {movementStats && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium">Total</div>
                            <div className="text-2xl font-bold">{movementStats.total}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Pending</div>
                            <div className="text-2xl font-bold text-yellow-600">
                              {movementStats.byStatus?.find((s: any) => s.status === 'PENDING')?.count || 0}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Audits Tab */}
                <TabsContent value="audits" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Audits API</CardTitle>
                      <CardDescription>9 endpoints - Audit scheduling + compliance tracking</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button onClick={loadAudits} disabled={loading} className="w-full" variant="outline">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        GET /api/audits
                      </Button>
                      <Button onClick={loadAuditStats} disabled={loading} className="w-full" variant="outline">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        GET /api/audits/stats
                      </Button>
                    </CardContent>
                  </Card>

                  {audits.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Audits ({audits.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {audits.map((audit) => (
                            <div key={audit.id} className="p-3 border rounded-lg">
                              <div className="font-semibold">{audit.location || 'All Locations'}</div>
                              <div className="text-sm text-muted-foreground">
                                <Badge variant="secondary">{audit.status}</Badge> • {audit.completionPercentage}% complete
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {auditStats && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium">Total</div>
                            <div className="text-2xl font-bold">{auditStats.total}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Discrepancies</div>
                            <div className="text-2xl font-bold text-red-600">{auditStats.totalDiscrepancies}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Files Tab */}
                <TabsContent value="files" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Files API</CardTitle>
                      <CardDescription>6 endpoints - File upload + preview</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button onClick={loadFileStats} disabled={loading} className="w-full" variant="outline">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        GET /api/files/stats
                      </Button>
                      <div className="text-sm text-muted-foreground p-3 border rounded-lg">
                        <strong>Supported:</strong> Images (JPG, PNG, GIF, WEBP), PDF, DOC/DOCX, XLS/XLSX, TXT, CSV
                      </div>
                    </CardContent>
                  </Card>

                  {fileStats && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium">Total Files</div>
                            <div className="text-2xl font-bold">{fileStats.totalFiles}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Total Size</div>
                            <div className="text-2xl font-bold">{fileStats.totalSizeMB} MB</div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="text-sm font-medium mb-2">By Type</div>
                          {Object.entries(fileStats.filesByType || {}).map(([type, count]: [string, any]) => (
                            <div key={type} className="flex justify-between text-sm">
                              <span className="capitalize">{type}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
