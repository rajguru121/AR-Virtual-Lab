#include <graphics.h>
#include <conio.h>
#include <iostream>
using namespace std;

// Draw a triangle given 3 vertices
void drawTriangle(int x[], int y[], int color)
{
    setcolor(color);
    line(x[0], y[0], x[1], y[1]);
    line(x[1], y[1], x[2], y[2]);
    line(x[2], y[2], x[0], y[0]);
}

int main()
{
    int gd = DETECT, gm;
    initgraph(&gd, &gm, "");

    int x[3], y[3];
    float sx, sy;
    int fx, fy;

    cout << "Enter 3 vertices of triangle (x y):" << endl;
    for (int i = 0; i < 3; i++)
    {
        cout << "Vertex " << i + 1 << ": ";
        cin >> x[i] >> y[i];
    }

    cout << "Enter fixed point (fx fy): ";
    cin >> fx >> fy;
    cout << "Enter scaling factors (sx sy): ";
    cin >> sx >> sy;

    // Draw original triangle in white
    outtextxy(10, 10, (char*)"2D Scaling");
    outtextxy(x[0] - 20, y[0] - 15, (char*)"Original");
    drawTriangle(x, y, WHITE);

    // Apply scaling about fixed point
    // x' = x * sx + fx * (1 - sx)
    // y' = y * sy + fy * (1 - sy)
    int nx[3], ny[3];
    for (int i = 0; i < 3; i++)
    {
        nx[i] = (int)(x[i] * sx + fx * (1 - sx));
        ny[i] = (int)(y[i] * sy + fy * (1 - sy));
    }

    // Draw scaled triangle in cyan
    outtextxy(nx[0] - 20, ny[0] - 15, (char*)"Scaled");
    drawTriangle(nx, ny, CYAN);

    // Mark fixed point
    setcolor(RED);
    circle(fx, fy, 3);

    getch();
    closegraph();
    return 0;
}
