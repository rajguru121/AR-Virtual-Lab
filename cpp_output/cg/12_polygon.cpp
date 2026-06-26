#include <graphics.h>
#include <conio.h>
#include <iostream>
using namespace std;

int main()
{
    int gd = DETECT, gm;
    initgraph(&gd, &gm, "");

    int n;
    cout << "Enter number of vertices: ";
    cin >> n;

    int x[20], y[20];
    cout << "Enter " << n << " vertices (x y):" << endl;
    for (int i = 0; i < n; i++)
    {
        cout << "Vertex " << i + 1 << ": ";
        cin >> x[i] >> y[i];
    }

    outtextxy(10, 10, (char*)"Polygon Drawing");

    // Draw polygon by connecting consecutive vertices
    setcolor(CYAN);
    for (int i = 0; i < n; i++)
    {
        int next = (i + 1) % n;
        line(x[i], y[i], x[next], y[next]);
    }

    // Mark vertices
    setcolor(YELLOW);
    for (int i = 0; i < n; i++)
    {
        circle(x[i], y[i], 3);
        char label[10];
        sprintf(label, "V%d", i + 1);
        outtextxy(x[i] + 5, y[i] - 15, label);
    }

    getch();
    closegraph();
    return 0;
}
